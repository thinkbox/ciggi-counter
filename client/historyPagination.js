// Splits the history list into one calendar day at a time, newest day first,
// and optionally into pages when a single day has a lot of entries.

const { formatLocalDay } = require("../shared/dates");

const PAGE_SIZES = new Set([10, 20, 50]);

function localDayKey(iso) {
  return formatLocalDay(new Date(iso));
}

function normalizePageSize(pageSize) {
  if (pageSize === "all") return "all";
  const size = Number(pageSize);
  return PAGE_SIZES.has(size) ? size : "all";
}

function sortNewestFirst(cigarettes) {
  return [...cigarettes].sort(
    (a, b) => new Date(b.smokedAt).getTime() - new Date(a.smokedAt).getTime(),
  );
}

function buildDays(sorted) {
  const days = [];
  for (const cigarette of sorted) {
    const key = localDayKey(cigarette.smokedAt);
    const last = days[days.length - 1];
    if (last && last.key === key) {
      last.count += 1;
      last.entries.push(cigarette);
    } else {
      days.push({ key, count: 1, entries: [cigarette] });
    }
  }
  return days;
}

function emptyPage() {
  return {
    days: [],
    dayKey: null,
    dayCount: 0,
    entries: [],
    pageIndex: 0,
    pageCount: 0,
    hasPrevDay: false,
    hasNextDay: false,
    showPager: false,
  };
}

function paginateHistory({ cigarettes, dayKey, pageSize, pageIndex }) {
  const sorted = sortNewestFirst(cigarettes ?? []);
  if (sorted.length === 0) return emptyPage();

  const days = buildDays(sorted);
  const size = normalizePageSize(pageSize);
  let dayIndex = days.findIndex((day) => day.key === dayKey);
  if (dayIndex < 0) dayIndex = 0;

  const day = days[dayIndex];
  const pageCount = size === "all" ? 1 : Math.ceil(day.count / size);
  let index = Number(pageIndex);
  if (!Number.isFinite(index) || index < 0) index = 0;
  if (size === "all") index = 0;
  if (index > pageCount - 1) index = pageCount - 1;

  const entries =
    size === "all"
      ? day.entries
      : day.entries.slice(index * size, index * size + size);

  return {
    days: days.map(({ key, count }) => ({ key, count })),
    dayKey: day.key,
    dayCount: day.count,
    entries,
    pageIndex: index,
    pageCount,
    hasPrevDay: dayIndex < days.length - 1,
    hasNextDay: dayIndex > 0,
    showPager: size !== "all" && day.count > size,
  };
}

function pageIndexForId(entriesOnDay, id, pageSize) {
  const size = normalizePageSize(pageSize);
  if (size === "all") return 0;
  const index = entriesOnDay.findIndex((entry) => entry.id === id);
  if (index < 0) return 0;
  return Math.floor(index / size);
}

function nearestDayKey(days, removedKey) {
  const keys = days.map((day) => day.key);
  if (keys.length === 0) return null;
  if (keys.includes(removedKey)) return removedKey;

  const newer = keys.filter((key) => key > removedKey).sort();
  if (newer.length > 0) return newer[0];

  const older = keys.filter((key) => key < removedKey).sort();
  if (older.length > 0) return older[older.length - 1];

  return null;
}

module.exports = {
  localDayKey,
  paginateHistory,
  pageIndexForId,
  nearestDayKey,
};
