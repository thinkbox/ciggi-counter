// Words and clock strings for "how long since a ciggi" and "when was it".
//
// Durations of an hour or more use a fixed pattern so the dashboard and the
// history list stay in sync. Shorter gaps use date-fns, which says things
// like "5 minutes ago".

const { format, formatDistance } = require("date-fns");

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function formatElapsedDuration(milliseconds, from, to, addSuffix) {
  if (milliseconds >= DAY_MS) {
    const days = Math.floor(milliseconds / DAY_MS);
    const hours = Math.floor((milliseconds % DAY_MS) / HOUR_MS);
    return `${days}d ${hours}hrs`;
  }
  if (milliseconds >= HOUR_MS) {
    const hours = Math.floor(milliseconds / HOUR_MS);
    const minutes = Math.floor((milliseconds % HOUR_MS) / 60000);
    return `${hours}hrs ${minutes}m`;
  }
  // `addSuffix` adds "ago" when the first date is in the past.
  return formatDistance(from, to, { addSuffix });
}

function latestCigarette(cigarettes) {
  let latest = null;
  for (const cigarette of cigarettes) {
    if (
      latest === null ||
      new Date(cigarette.smokedAt).getTime() > new Date(latest.smokedAt).getTime()
    ) {
      latest = cigarette;
    }
  }
  return latest;
}

function formatElapsedSince(iso, now = Date.now()) {
  const from = new Date(iso);
  const milliseconds = now - from.getTime();
  return formatElapsedDuration(milliseconds, from, new Date(now), true);
}

function formatElapsedLabel(cigarettes, now = Date.now()) {
  if (!cigarettes || cigarettes.length === 0) return "No ciggis logged";
  return formatElapsedSince(latestCigarette(cigarettes).smokedAt, now);
}

function formatElapsedBetween(earlierIso, laterIso) {
  const earlier = new Date(earlierIso);
  const later = new Date(laterIso);
  const milliseconds = later.getTime() - earlier.getTime();
  if (milliseconds < 0) return "— ";
  return formatElapsedDuration(milliseconds, earlier, later, false);
}

function formatLastCiggiAt(cigarettes) {
  if (!cigarettes || cigarettes.length === 0) return "— ";
  return format(new Date(latestCigarette(cigarettes).smokedAt), "EEE, d MMM, h:mm a");
}

function formatWhen(iso, pattern) {
  return format(new Date(iso), pattern);
}

function toDatetimeLocalValue(value) {
  const date = new Date(value);
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function lastCiggiOrTodayStart(cigarettes) {
  if (!cigarettes || cigarettes.length === 0) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return new Date(latestCigarette(cigarettes).smokedAt);
}

module.exports = {
  formatElapsedSince,
  formatElapsedLabel,
  formatElapsedBetween,
  formatLastCiggiAt,
  formatWhen,
  toDatetimeLocalValue,
  lastCiggiOrTodayStart,
};
