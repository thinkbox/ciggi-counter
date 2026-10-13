const assert = require("node:assert/strict");
const { goalForDay, periodGoalSummary, formatLocalDay } = require("./dailyGoal");

const goals = [
  { day: "2026-10-01", goal: 15 },
  { day: "2026-10-14", goal: 10 },
  { day: "2026-10-20", goal: 6 },
];

assert.equal(goalForDay(goals, "2026-09-30"), null);
assert.equal(goalForDay(goals, "2026-10-01"), 15);
assert.equal(goalForDay(goals, "2026-10-13"), 15);
assert.equal(goalForDay(goals, "2026-10-14"), 10);
assert.equal(goalForDay(goals, "2026-10-19"), 10);
assert.equal(goalForDay(goals, "2026-10-20"), 6);
assert.equal(goalForDay(goals, "2026-11-01"), 6);
assert.equal(goalForDay([], "2026-10-14"), null);
assert.equal(goalForDay(null, "2026-10-14"), null);

assert.equal(formatLocalDay(new Date(2026, 9, 14, 23, 30)), "2026-10-14");

const skipped = periodGoalSummary(
  goals,
  new Date(2026, 8, 30),
  new Date(2026, 9, 2),
);
assert.deepEqual(skipped, {
  budget: 30,
  daysWithGoal: 2,
  daysWithoutGoal: 1,
  dayCount: 3,
});

const covered = periodGoalSummary(
  goals,
  new Date(2026, 9, 12),
  new Date(2026, 9, 15),
);
assert.deepEqual(covered, {
  budget: 50,
  daysWithGoal: 4,
  daysWithoutGoal: 0,
  dayCount: 4,
});

console.log("ok");
