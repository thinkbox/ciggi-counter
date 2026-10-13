function localToday(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isRealDay(day) {
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [year, month, date] = day.split("-").map(Number);
  const parsed = new Date(year, month - 1, date);
  return (
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === date
  );
}

function isValidGoal(dailyGoal) {
  return Number.isInteger(dailyGoal) && dailyGoal >= 0 && dailyGoal <= 200;
}

function migrateLegacyDailyGoal(db, today = localToday()) {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'daily_goal'")
    .get();
  if (!row) return;

  let goal = null;
  try {
    goal = JSON.parse(row.value);
  } catch (_) {
    goal = null;
  }

  if (Number.isInteger(goal)) {
    db.prepare(
      "INSERT OR IGNORE INTO daily_goals (day, goal) VALUES (?, ?)"
    ).run(today, goal);
  }

  db.prepare("DELETE FROM settings WHERE key = 'daily_goal'").run();
}

function listDailyGoals(db) {
  return db.prepare("SELECT day, goal FROM daily_goals ORDER BY day").all();
}

function upsertDailyGoal(db, day, goal) {
  db.prepare(
    "INSERT INTO daily_goals (day, goal) VALUES (?, ?) ON CONFLICT(day) DO UPDATE SET goal = excluded.goal"
  ).run(day, goal);
}

module.exports = {
  localToday,
  isRealDay,
  isValidGoal,
  migrateLegacyDailyGoal,
  listDailyGoals,
  upsertDailyGoal,
};
