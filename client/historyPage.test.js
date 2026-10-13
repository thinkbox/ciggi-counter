const assert = require("node:assert/strict");
const {
  formatHistoryNavLabel,
  historyNavTargets,
  suggestedHistoryAdd,
  dateTimeInputs,
} = require("./historyPage");

function at(y, m, d, h = 12, min = 0, s = 0) {
  return new Date(y, m - 1, d, h, min, s).toISOString();
}

{
  assert.equal(formatHistoryNavLabel("2026-10-11"), "11 Oct");
  assert.equal(formatHistoryNavLabel("2026-01-05"), "5 Jan");
}

{
  const days = [{ key: "2026-10-12" }, { key: "2026-10-11" }, { key: "2026-10-10" }];
  assert.deepEqual(historyNavTargets(days, "2026-10-11"), {
    newer: "2026-10-12",
    older: "2026-10-10",
  });
  assert.deepEqual(historyNavTargets(days, "2026-10-12"), {
    newer: null,
    older: "2026-10-11",
  });
  assert.deepEqual(historyNavTargets(days, "2026-10-10"), {
    newer: "2026-10-11",
    older: null,
  });
}

// Last ciggi 5:00 PM, pace interval 1 hour, now 9:00 PM → 6:00 PM
{
  const result = suggestedHistoryAdd({
    dayKey: "2026-10-11",
    cigarettes: [{ id: "a", smokedAt: at(2026, 10, 11, 17, 0) }],
    dailyGoal: 8,
    now: new Date(2026, 9, 11, 21, 0),
  });
  assert.deepEqual(result, { date: "2026-10-11", time: "18:00" });
}

// Current time is earlier than last ciggi + pace → use the current time
{
  const result = suggestedHistoryAdd({
    dayKey: "2026-10-11",
    cigarettes: [{ id: "a", smokedAt: at(2026, 10, 11, 17, 0) }],
    dailyGoal: 8,
    now: new Date(2026, 9, 11, 17, 20),
  });
  assert.deepEqual(result, { date: "2026-10-11", time: "17:20" });
}

// Pace is measured from the latest ciggi that day
{
  const result = suggestedHistoryAdd({
    dayKey: "2026-10-11",
    cigarettes: [
      { id: "early", smokedAt: at(2026, 10, 11, 10, 0) },
      { id: "late", smokedAt: at(2026, 10, 11, 17, 0) },
    ],
    dailyGoal: 9,
    now: new Date(2026, 9, 11, 21, 0),
  });
  assert.deepEqual(result, { date: "2026-10-11", time: "18:00" });
}

// Last + pace lands on or after midnight → 11:59 PM
{
  const result = suggestedHistoryAdd({
    dayKey: "2026-10-11",
    cigarettes: [{ id: "a", smokedAt: at(2026, 10, 11, 22, 0) }],
    dailyGoal: 2,
    now: new Date(2026, 9, 12, 9, 0),
  });
  assert.deepEqual(result, { date: "2026-10-11", time: "23:59" });
}

// Current time still on that day beats a pace that would pass midnight
{
  const result = suggestedHistoryAdd({
    dayKey: "2026-10-11",
    cigarettes: [{ id: "a", smokedAt: at(2026, 10, 11, 22, 0) }],
    dailyGoal: 2,
    now: new Date(2026, 9, 11, 22, 40),
  });
  assert.deepEqual(result, { date: "2026-10-11", time: "22:40" });
}

// No pace on a past day → 11:59 PM of the history date
{
  const result = suggestedHistoryAdd({
    dayKey: "2026-10-11",
    cigarettes: [{ id: "a", smokedAt: at(2026, 10, 11, 17, 0) }],
    dailyGoal: null,
    now: new Date(2026, 9, 12, 9, 0),
  });
  assert.deepEqual(result, { date: "2026-10-11", time: "23:59" });
}

// No pace while viewing today → the current time
{
  const result = suggestedHistoryAdd({
    dayKey: "2026-10-11",
    cigarettes: [{ id: "a", smokedAt: at(2026, 10, 11, 17, 0) }],
    dailyGoal: 1,
    now: new Date(2026, 9, 11, 21, 5),
  });
  assert.deepEqual(result, { date: "2026-10-11", time: "21:05" });
}

{
  const result = dateTimeInputs(at(2026, 10, 11, 18, 30, 45));
  assert.equal(result.date, "2026-10-11");
  assert.equal(result.time, "18:30:45");
}

{
  const result = dateTimeInputs(at(2026, 10, 11, 18, 30, 0));
  assert.equal(result.time, "18:30");
}

{
  const result = suggestedHistoryAdd({
    dayKey: null,
    cigarettes: [],
    dailyGoal: null,
    now: new Date(2026, 9, 11, 21, 5),
  });
  assert.deepEqual(result, { date: "2026-10-11", time: "21:05" });
}
