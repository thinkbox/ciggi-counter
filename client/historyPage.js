function getNextCiggiPace() {
  if (typeof window !== "undefined" && typeof window.nextCiggiPace === "function") {
    return window.nextCiggiPace;
  }
  return require("./nextCiggiPace").nextCiggiPace;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad(value) {
  return String(value).padStart(2, "0");
}

function parseDayKey(dayKey) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
  return { start: start.getTime(), end: end.getTime() };
}

function formatLocalDay(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatClock(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatHistoryNavLabel(dayKey) {
  const [, month, day] = dayKey.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
}

function historyNavTargets(days, dayKey) {
  const index = (days || []).findIndex((day) => day.key === dayKey);
  if (index < 0) return { newer: null, older: null };
  return {
    newer: index > 0 ? days[index - 1].key : null,
    older: index < days.length - 1 ? days[index + 1].key : null,
  };
}

function dateTimeInputs(iso) {
  const date = new Date(iso);
  const seconds = date.getSeconds();
  return {
    date: formatLocalDay(date),
    time: seconds ? `${formatClock(date)}:${pad(seconds)}` : formatClock(date),
  };
}

function suggestedHistoryAdd({ dayKey, cigarettes, dailyGoal, now }) {
  const nowDate = now instanceof Date ? now : new Date(now);
  const nowMs = nowDate.getTime();
  const key = dayKey || formatLocalDay(nowDate);
  const { start, end } = parseDayKey(key);
  const nowOnDay = nowMs >= start && nowMs < end;

  let latest = null;
  let count = 0;
  for (const cigarette of cigarettes || []) {
    const t = new Date(cigarette.smokedAt).getTime();
    if (t < start || t >= end) continue;
    count += 1;
    if (latest === null || t > latest) latest = t;
  }

  let target = null;
  if (latest !== null) {
    const pace = getNextCiggiPace()({
      dailyGoal,
      todayCount: count,
      anchorAt: latest,
      now: latest,
      dayEnd: end,
    });
    if (pace) target = latest + pace.intervalMs;
  }

  if (target !== null && nowMs < target && nowOnDay) {
    return { date: key, time: formatClock(nowDate) };
  }

  if (target === null || target >= end) {
    if (target === null && nowOnDay) {
      return { date: key, time: formatClock(nowDate) };
    }
    return { date: key, time: "23:59" };
  }

  return { date: key, time: formatClock(new Date(target)) };
}

const historyPageApi = {
  formatHistoryNavLabel,
  historyNavTargets,
  suggestedHistoryAdd,
  dateTimeInputs,
};

if (typeof module === "object" && module.exports) {
  module.exports = historyPageApi;
}

if (typeof window !== "undefined") {
  window.formatHistoryNavLabel = formatHistoryNavLabel;
  window.historyNavTargets = historyNavTargets;
  window.suggestedHistoryAdd = suggestedHistoryAdd;
  window.dateTimeInputs = dateTimeInputs;
}
