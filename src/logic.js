// One import list for the pages. The calculation files live next to the
// tests and use Node's module style. Vite rewrites that for the browser
// (see vite.config.mjs), and these lines pass the functions through.

export { formatLocalDay } from "../shared/dates.js";
export { goalForDay, periodGoalSummary } from "../client/dailyGoal.js";
export { dashboardPeriodStats } from "../client/dashboardStats.js";
export {
  dateTimeInputs,
  formatHistoryNavLabel,
  historyNavTargets,
  suggestedHistoryAdd,
} from "../client/historyPage.js";
export { nearestDayKey, pageIndexForId, paginateHistory } from "../client/historyPagination.js";
export {
  formatElapsedBetween,
  formatElapsedLabel,
  formatLastCiggiAt,
  formatWhen,
  lastCiggiOrTodayStart,
  toDatetimeLocalValue,
} from "../client/timeFormat.js";
export { formatPaceClock, latestCiggiToday, localDayBounds, nextCiggiPace } from "../client/nextCiggiPace.js";
export { dailyChartPoints, summarizeStats } from "../client/stats.js";
export { requestAllowingClose } from "../client/allowClose.js";
