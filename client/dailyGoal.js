// Which daily goal is in force on a given calendar day.
//
// Goals are stored as "from this date onward, the limit is N" until a later
// date sets a new limit. A day with no goal on or before it has no limit.

const { formatLocalDay } = require("../shared/dates");

function goalForDay(goals, dayKey) {
  let match = null;
  // `??` means "if the left side is null or undefined, use the right side".
  // So a missing goals list is treated as empty.
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

module.exports = { formatLocalDay, goalForDay, periodGoalSummary };
