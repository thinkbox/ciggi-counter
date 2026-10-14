// One-time move of data that an older version of the app stored in the
// browser. If the server already has cigarettes, it leaves this alone.

const STORAGE_KEY = "cigicounter-data";

export async function migrateFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    const res = await fetch("/api/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;
    const { migrated } = await res.json();
    if (migrated) localStorage.removeItem(STORAGE_KEY);
  } catch {
    // A bad saved blob or a down server should not block the page.
  }
}
