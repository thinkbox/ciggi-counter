// Logging a ciggi that is within five minutes of another one.
//
// The server answers HTTP 409 with code "too_close". This asks the person
// to confirm, then sends the same request again with allowClose: true.
// `async` means the function waits on network calls. `await` pauses on
// that one line until the call finishes.

const { format } = require("date-fns");

function errorMessage(status, text, statusText) {
  try {
    const data = JSON.parse(text);
    if (data && data.error) return data.error;
  } catch {
    // The body was not JSON. Fall through to the status line.
  }
  return `${status}: ${text || statusText}`;
}

function formatCloseWarning(conflicts) {
  const seen = new Set();
  const lines = [];
  for (const conflict of conflicts || []) {
    const label = format(new Date(conflict.near), "EEE, d MMM, h:mm a");
    if (seen.has(label)) continue;
    seen.add(label);
    lines.push(label);
  }
  const shown = lines.slice(0, 3);
  const extra = lines.length > 3 ? ` and ${lines.length - 3} more` : "";
  return `This is within 5 minutes of a ciggi at ${shown.join(", ")}${extra}. You can't smoke two at once.\n\nLog anyway?`;
}

async function requestAllowingClose(path, body, method, deps) {
  const verb = method || "POST";
  const res = await deps.request(path, body, verb);

  if (res.status === 409) {
    const data = await res.clone().json();
    if (data && data.code === "too_close") {
      const allowed = deps.confirm(formatCloseWarning(data.conflicts));
      if (!allowed) {
        const err = new Error("cancelled");
        err.cancelled = true;
        throw err;
      }
      const retry = await deps.request(path, { ...body, allowClose: true }, verb);
      if (!retry.ok) {
        const text = await retry.text();
        throw new Error(errorMessage(retry.status, text, retry.statusText));
      }
      return retry;
    }
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(errorMessage(res.status, text, res.statusText));
  }
  return res;
}

module.exports = { formatCloseWarning, requestAllowingClose };
