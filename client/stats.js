// Counts for the Stats page: this period versus the one before it,
// long-run averages, and one bar per day for the chart.
//
// Weeks start on Monday, matching the dashboard.

const {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  differenceInCalendarDays,
  differenceInCalendarWeeks,
  differenceInCalendarMonths,
  differenceInCalendarYears,
  format,
} = require("date-fns");
const { formatLocalDay } = require("../shared/dates");
const { goalForDay } = require("./dailyGoal");

const WEEK = { weekStartsOn: 1 };

function countBetween(cigarettes, start, end) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return cigarettes.filter((cigarette) => {
    const smokedAt = new Date(cigarette.smokedAt).getTime();
    return smokedAt >= startMs && smokedAt <= endMs;
  }).length;
}

function summarizeStats(cigarettes, now = new Date()) {
  const list = cigarettes || [];
  const yesterday = subDays(now, 1);
  const lastWeek = subWeeks(now, 1);
  const lastMonth = subMonths(now, 1);
  const lastYear = subYears(now, 1);

  const today = countBetween(list, startOfDay(now), endOfDay(now));
  const yesterdayCount = countBetween(list, startOfDay(yesterday), endOfDay(yesterday));
  const thisWeek = countBetween(list, startOfWeek(now, WEEK), endOfWeek(now, WEEK));
  const lastWeekCount = countBetween(
    list,
    startOfWeek(lastWeek, WEEK),
    endOfWeek(lastWeek, WEEK),
  );
  const thisMonth = countBetween(list, startOfMonth(now), endOfMonth(now));
  const lastMonthCount = countBetween(list, startOfMonth(lastMonth), endOfMonth(lastMonth));
  const thisYear = countBetween(list, startOfYear(now), endOfYear(now));
  const lastYearCount = countBetween(list, startOfYear(lastYear), endOfYear(lastYear));

  const comparisons = [
    { label: "Today", current: today, previous: yesterdayCount, diff: today - yesterdayCount },
    { label: "This Week", current: thisWeek, previous: lastWeekCount, diff: thisWeek - lastWeekCount },
    { label: "This Month", current: thisMonth, previous: lastMonthCount, diff: thisMonth - lastMonthCount },
    { label: "This Year", current: thisYear, previous: lastYearCount, diff: thisYear - lastYearCount },
  ];

  const averages = [];
  if (list.length > 0) {
    const first = list.reduce((earliest, cigarette) => {
      return new Date(cigarette.smokedAt) < new Date(earliest.smokedAt) ? cigarette : earliest;
    });
    const firstAt = new Date(first.smokedAt);
    const total = list.length;
    // At least 1, so a brand-new log is "1.0 per day" rather than a division by zero.
    const spans = [
      ["Per Day", Math.max(differenceInCalendarDays(now, firstAt), 1)],
      ["Per Week", Math.max(differenceInCalendarWeeks(now, firstAt, WEEK), 1)],
      ["Per Month", Math.max(differenceInCalendarMonths(now, firstAt), 1)],
      ["Per Year", Math.max(differenceInCalendarYears(now, firstAt), 1)],
    ];
    for (const [label, span] of spans) {
      averages.push({ label, value: (total / span).toFixed(1) });
    }
  }

  return {
    today,
    yesterday: yesterdayCount,
    thisWeek,
    lastWeek: lastWeekCount,
    thisMonth,
    lastMonth: lastMonthCount,
    thisYear,
    lastYear: lastYearCount,
    total: list.length,
    comparisons,
    averages,
  };
}

function dailyChartPoints(cigarettes, goals, dayCount, now = new Date()) {
  const points = [];
  for (let ago = dayCount - 1; ago >= 0; ago -= 1) {
    const day = startOfDay(subDays(now, ago));
    points.push({
      date: format(day, "d MMM"),
      fullDate: format(day, "EEE d MMM yyyy"),
      count: countBetween(cigarettes || [], day, endOfDay(day)),
      goal: goalForDay(goals, formatLocalDay(day)),
    });
  }
  return points;
}

module.exports = { summarizeStats, dailyChartPoints };
