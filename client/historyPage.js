// History-screen helpers: day labels, which day the arrows should open,
// and the date/time to prefill when adding a ciggi on that day.

const { nextCiggiPace } = require("./nextCiggiPace");
const { formatLocalDay } = require("../shared/dates");

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

// Prefills Add Ciggi. If the pace target is still ahead and we are looking
// at today, use the current time. Otherwise use the pace target, or 23:59
// when that target would fall off the end of the day.
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
    const pace = nextCiggiPace({
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

module.exports = historyPageApi;
