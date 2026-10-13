function startOfLocalDay(date) {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

function endOfLocalDay(date) {
  const day = new Date(date);
  day.setHours(23, 59, 59, 999);
  return day;
}

function startOfWeekMonday(date) {
  const day = startOfLocalDay(date);
  const daysSinceMonday = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - daysSinceMonday);
  return day;
}

function endOfWeekSunday(date) {
  const end = startOfWeekMonday(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function countBetween(cigarettes, start, end) {
  const startMs = start.getTime();
  const endMs = end.getTime();
  return cigarettes.filter((cigarette) => {
    const smokedAt = new Date(cigarette.smokedAt).getTime();
    return smokedAt >= startMs && smokedAt <= endMs;
  }).length;
}

function weekdayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function localDayKeyFromDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dashboardPeriodStats(cigarettes, now) {
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);
  const thisWeekStart = startOfWeekMonday(now);
  const thisWeekEnd = endOfWeekSunday(now);

  const previousWeek = new Date(now);
  previousWeek.setDate(previousWeek.getDate() - 7);
  const lastWeekStart = startOfWeekMonday(previousWeek);
  const lastWeekEnd = endOfWeekSunday(previousWeek);

  const recentDays = [];
  for (let offset = 1; offset <= 6; offset += 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    const start = startOfLocalDay(day);
    const end = endOfLocalDay(day);
    recentDays.push({
      label: offset === 1 ? "Yesterday" : weekdayName(start),
      key: localDayKeyFromDate(start),
      count: countBetween(cigarettes, start, end),
    });
  }

  return {
    today: countBetween(cigarettes, todayStart, todayEnd),
    thisWeek: countBetween(cigarettes, thisWeekStart, thisWeekEnd),
    lastWeek: countBetween(cigarettes, lastWeekStart, lastWeekEnd),
    recentDays,
  };
}

if (typeof module === "object" && module.exports) {
  module.exports = { dashboardPeriodStats };
}

if (typeof window !== "undefined") {
  window.dashboardPeriodStats = dashboardPeriodStats;
}
