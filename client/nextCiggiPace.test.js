const assert = require("node:assert/strict");
const {
  nextCiggiPace,
  formatPaceClock,
  latestCiggiToday,
} = require("./nextCiggiPace");

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function pace(overrides) {
  return nextCiggiPace({
    dailyGoal: 10,
    todayCount: 0,
    anchorAt: 0,
    now: 0,
    dayEnd: DAY,
    ...overrides,
  });
}

// Full red at the moment the window opens
{
  const result = pace({ now: 0 });
  assert.equal(result.phase, "waiting");
  assert.equal(result.color, "red");
  assert.equal(result.fill, "#dc2626");
  assert.equal(result.bar, 1);
  assert.equal(result.intervalMs, 2.4 * HOUR);
  assert.equal(result.remainingMs, 2.4 * HOUR);
  assert.equal(result.overtimeMs, 0);
}

// Still red while more than 20% of the interval remains
{
  const interval = 2.4 * HOUR;
  const result = pace({ now: interval * 0.8 - 1 });
  assert.equal(result.color, "red");
  assert.ok(result.bar > 0.2);
}

// Orange at 20% remaining
{
  const interval = 2.4 * HOUR;
  const result = pace({ now: interval * 0.8 });
  assert.equal(result.phase, "waiting");
  assert.equal(result.color, "orange");
  assert.equal(result.fill, "#f97316");
  assert.equal(result.bar, 0.2);
}

// Green and empty the instant the pace time is reached
{
  const interval = 2.4 * HOUR;
  const result = pace({ now: interval });
  assert.equal(result.phase, "ready");
  assert.equal(result.color, "green");
  assert.equal(result.fill, "#16a34a");
  assert.equal(result.bar, 0);
  assert.equal(result.remainingMs, 0);
  assert.equal(result.overtimeMs, 0);
}

// Green refill is halfway through the same interval of overtime
{
  const interval = 2.4 * HOUR;
  const result = pace({ now: interval + interval / 2 });
  assert.equal(result.phase, "ready");
  assert.equal(result.color, "green");
  assert.equal(result.bar, 0.5);
  assert.equal(result.overtimeMs, interval / 2);
}

// The green bar stays full once overtime reaches another full interval
{
  const interval = 2.4 * HOUR;
  const result = pace({ now: interval + interval * 3 });
  assert.equal(result.color, "green");
  assert.equal(result.bar, 1);
  assert.equal(result.overtimeMs, interval * 3);
}

// Hidden once today's budget is used up, including when over the limit
{
  assert.equal(pace({ todayCount: 10 }), null);
  assert.equal(pace({ todayCount: 12 }), null);
  assert.equal(pace({ dailyGoal: 0, todayCount: 0 }), null);
  assert.equal(pace({ dailyGoal: null, todayCount: 0 }), null);
}

// Logging another ciggi opens a new window from that time
{
  const loggedAt = 8 * HOUR;
  const result = pace({
    todayCount: 1,
    anchorAt: loggedAt,
    now: loggedAt,
  });
  assert.equal(result.phase, "waiting");
  assert.equal(result.color, "red");
  assert.equal(result.bar, 1);
  assert.equal(result.intervalMs, (16 * HOUR) / 9);
  assert.equal(result.targetAt, loggedAt + (16 * HOUR) / 9);
}

// Clock shows hours when needed, and a plus once pace time has passed
{
  assert.equal(formatPaceClock(1 * HOUR + 46 * 60 * 1000 + 12 * 1000, false), "1:46:12");
  assert.equal(formatPaceClock(46 * 60 * 1000 + 12 * 1000, false), "46:12");
  assert.equal(formatPaceClock(12 * 60 * 1000 + 4 * 1000, true), "+12:04");
  assert.equal(formatPaceClock(0, true), "+0:00");
}

// The window anchor is the latest ciggi today, not one from yesterday
{
  const now = new Date(2026, 8, 27, 15, 0, 0).getTime();
  const yesterday = new Date(2026, 8, 26, 23, 0, 0).toISOString();
  const morning = new Date(2026, 8, 27, 9, 0, 0).toISOString();
  const afternoon = new Date(2026, 8, 27, 14, 30, 0).toISOString();
  assert.equal(
    latestCiggiToday(
      [{ smokedAt: yesterday }, { smokedAt: morning }, { smokedAt: afternoon }],
      now
    ),
    new Date(afternoon).getTime()
  );
  assert.equal(latestCiggiToday([{ smokedAt: yesterday }], now), null);
}

console.log("nextCiggiPace tests passed");
