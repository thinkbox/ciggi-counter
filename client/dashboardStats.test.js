const assert = require("node:assert/strict");
const { dashboardPeriodStats } = require("./dashboardStats");

function at(y, m, d, h = 12, min = 0, s = 0, ms = 0) {
  return new Date(y, m - 1, d, h, min, s, ms).toISOString();
}

function cig(iso) {
  return { smokedAt: iso };
}

// Monday 28 Sep 2026 15:00 local. This week is 28 Sep–4 Oct.
// Last week is the previous Monday–Sunday, 21–27 Sep, and does not include today.
{
  const now = new Date(2026, 8, 28, 15, 0, 0, 0);
  const stats = dashboardPeriodStats(
    [
      cig(at(2026, 9, 28, 0, 0, 0, 0)),
      cig(at(2026, 9, 28, 10, 0)),
      cig(at(2026, 9, 27, 23, 59, 59, 999)),
      cig(at(2026, 9, 21, 0, 0, 0, 0)),
      cig(at(2026, 9, 20, 23, 59, 59, 999)),
      cig(at(2026, 9, 26, 8, 0)),
      cig(at(2026, 9, 22, 8, 0)),
    ],
    now,
  );

  assert.equal(stats.today, 2);
  assert.equal(stats.thisWeek, 2);
  assert.equal(stats.lastWeek, 4);

  assert.deepEqual(
    stats.recentDays.map((day) => day.label),
    ["Yesterday", "Saturday", "Friday", "Thursday", "Wednesday", "Tuesday"],
  );
  assert.deepEqual(
    stats.recentDays.map((day) => day.count),
    [1, 1, 0, 0, 0, 1],
  );
  assert.deepEqual(
    stats.recentDays.map((day) => day.key),
    [
      "2026-09-27",
      "2026-09-26",
      "2026-09-25",
      "2026-09-24",
      "2026-09-23",
      "2026-09-22",
    ],
  );
}

// Wednesday 30 Sep 2026. This week still starts Monday and excludes last Sunday.
{
  const now = new Date(2026, 8, 30, 9, 0, 0, 0);
  const stats = dashboardPeriodStats(
    [
      cig(at(2026, 9, 30, 8, 0)),
      cig(at(2026, 9, 29, 11, 0)),
      cig(at(2026, 9, 28, 10, 0)),
      cig(at(2026, 9, 27, 18, 0)),
      cig(at(2026, 9, 30, 0, 0, 0, 0)),
      cig(at(2026, 9, 29, 23, 59, 59, 999)),
    ],
    now,
  );

  assert.equal(stats.today, 2);
  assert.equal(stats.thisWeek, 5);
  assert.equal(stats.lastWeek, 1);
  assert.equal(stats.recentDays[0].label, "Yesterday");
  assert.equal(stats.recentDays[0].count, 2);
  assert.equal(stats.recentDays[0].key, "2026-09-29");
  assert.equal(stats.recentDays[1].label, "Monday");
  assert.equal(stats.recentDays[1].count, 1);
  assert.equal(stats.recentDays[1].key, "2026-09-28");
  assert.equal(stats.recentDays.length, 6);
}
