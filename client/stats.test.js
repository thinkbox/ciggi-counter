// Checks period counts and the 30-day chart points. Run with `npm test`.
const assert = require("node:assert/strict");
const { summarizeStats, dailyChartPoints } = require("./stats");

const now = new Date(2026, 9, 14, 15, 0, 0);
const cigarettes = [
  { id: "today", smokedAt: new Date(2026, 9, 14, 9).toISOString() },
  { id: "yesterday", smokedAt: new Date(2026, 9, 13, 9).toISOString() },
  { id: "earlier", smokedAt: new Date(2026, 9, 7, 9).toISOString() },
];

const stats = summarizeStats(cigarettes, now);
assert.equal(stats.today, 1);
assert.equal(stats.yesterday, 1);
assert.equal(stats.thisWeek, 2);
assert.equal(stats.lastWeek, 1);
assert.equal(stats.total, 3);
assert.equal(stats.comparisons[0].label, "Today");
assert.equal(stats.comparisons[0].diff, 0);
assert.equal(stats.comparisons[1].diff, 1);
assert.equal(stats.averages[0].label, "Per Day");
assert.equal(summarizeStats([], now).averages.length, 0);

const points = dailyChartPoints(
  cigarettes,
  [{ day: "2026-10-01", goal: 5 }],
  30,
  now,
);
assert.equal(points.length, 30);
assert.equal(points[points.length - 1].count, 1);
assert.equal(points[points.length - 1].goal, 5);
assert.equal(points[0].count, 0);

console.log("stats.test.js passed");
