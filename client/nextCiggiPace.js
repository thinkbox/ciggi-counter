// How long until the next ciggi if today's remaining allowance is spread
// evenly across the rest of the day. Returns null when there is no goal,
// the goal is already met, or the inputs are not usable.

const PACE_COLORS = {
  red: "#dc2626",
  orange: "#f97316",
  green: "#16a34a",
};

function nextCiggiPace({ dailyGoal, todayCount, anchorAt, now, dayEnd }) {
  if (typeof dailyGoal !== "number" || dailyGoal <= 0) return null;
  if (typeof todayCount !== "number" || todayCount < 0) return null;
  if (typeof anchorAt !== "number" || typeof now !== "number" || typeof dayEnd !== "number") {
    return null;
  }

  const remaining = dailyGoal - todayCount;
  if (remaining <= 0) return null;

  const windowMs = dayEnd - anchorAt;
  if (windowMs <= 0) return null;

  const intervalMs = windowMs / remaining;
  const targetAt = anchorAt + intervalMs;

  if (now < targetAt) {
    const remainingMs = targetAt - now;
    const bar = remainingMs / intervalMs;
    const color = bar <= 0.2 ? "orange" : "red";
    return {
      phase: "waiting",
      remainingMs,
      overtimeMs: 0,
      bar,
      color,
      fill: PACE_COLORS[color],
      intervalMs,
      targetAt,
    };
  }

  const overtimeMs = now - targetAt;
  return {
    phase: "ready",
    remainingMs: 0,
    overtimeMs,
    bar: Math.min(overtimeMs / intervalMs, 1),
    color: "green",
    fill: PACE_COLORS.green,
    intervalMs,
    targetAt,
  };
}

function formatPaceClock(ms, overtime) {
  const sign = overtime ? "+" : "";
  const total = Math.max(0, Math.floor(Number(ms) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const body =
    hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${minutes}:${pad(seconds)}`;
  return sign + body;
}

function localDayBounds(now) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return { dayStart: dayStart.getTime(), dayEnd: dayEnd.getTime() };
}

function latestCiggiToday(cigs, now) {
  const { dayStart, dayEnd } = localDayBounds(now);
  let latest = null;
  for (const cig of cigs || []) {
    const t = new Date(cig.smokedAt).getTime();
    if (t >= dayStart && t < dayEnd && (latest === null || t > latest)) {
      latest = t;
    }
  }
  return latest;
}

const api = {
  PACE_COLORS,
  nextCiggiPace,
  formatPaceClock,
  localDayBounds,
  latestCiggiToday,
};

module.exports = api;
