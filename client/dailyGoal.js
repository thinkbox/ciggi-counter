function formatLocalDay(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function goalForDay(goals, dayKey) {
  let match = null;
  for (const row of goals ?? []) {
    if (row.day <= dayKey && (match === null || row.day > match.day)) {
      match = row;
    }
  }
  return match ? match.goal : null;
}

function periodGoalSummary(goals, startDate, endDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  let budget = 0;
  let daysWithGoal = 0;
  let daysWithoutGoal = 0;
  let dayCount = 0;

  for (
    let cursor = new Date(start);
    cursor.getTime() <= end.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    dayCount += 1;
    const goal = goalForDay(goals, formatLocalDay(cursor));
    if (goal == null) {
      daysWithoutGoal += 1;
    } else {
      daysWithGoal += 1;
      budget += goal;
    }
  }

  return { budget, daysWithGoal, daysWithoutGoal, dayCount };
}

if (typeof module === "object" && module.exports) {
  module.exports = { formatLocalDay, goalForDay, periodGoalSummary };
}

if (typeof window !== "undefined") {
  window.formatLocalDay = formatLocalDay;
  window.goalForDay = goalForDay;
  window.periodGoalSummary = periodGoalSummary;
}
