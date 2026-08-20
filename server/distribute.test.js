const assert = require("node:assert/strict");
const { distributeSmokedAts } = require("./distribute");

const from = "2026-08-20T12:00:00.000Z";
const to = "2026-08-20T16:00:00.000Z";

function hours(isoList) {
  return isoList.map((iso) => new Date(iso).toISOString());
}

function assertThrows(fn, pattern) {
  assert.throws(fn, (err) => {
    assert.match(String(err.message), pattern);
    return true;
  });
}

// Confirmed: from off, to on, count 4 → equal steps, last at To
{
  const result = distributeSmokedAts({
    from,
    to,
    count: 4,
    includeFrom: false,
    includeTo: true,
  });
  assert.deepEqual(hours(result), [
    "2026-08-20T13:00:00.000Z",
    "2026-08-20T14:00:00.000Z",
    "2026-08-20T15:00:00.000Z",
    "2026-08-20T16:00:00.000Z",
  ]);
}

// Both endpoints included, count 5 → 12, 13, 14, 15, 16
{
  const result = distributeSmokedAts({
    from,
    to,
    count: 5,
    includeFrom: true,
    includeTo: true,
  });
  assert.deepEqual(hours(result), [
    "2026-08-20T12:00:00.000Z",
    "2026-08-20T13:00:00.000Z",
    "2026-08-20T14:00:00.000Z",
    "2026-08-20T15:00:00.000Z",
    "2026-08-20T16:00:00.000Z",
  ]);
}

// From included, To excluded, count 4 → 12, 13, 14, 15
{
  const result = distributeSmokedAts({
    from,
    to,
    count: 4,
    includeFrom: true,
    includeTo: false,
  });
  assert.deepEqual(hours(result), [
    "2026-08-20T12:00:00.000Z",
    "2026-08-20T13:00:00.000Z",
    "2026-08-20T14:00:00.000Z",
    "2026-08-20T15:00:00.000Z",
  ]);
}

// Neither endpoint, count 3 → 13, 14, 15
{
  const result = distributeSmokedAts({
    from,
    to,
    count: 3,
    includeFrom: false,
    includeTo: false,
  });
  assert.deepEqual(hours(result), [
    "2026-08-20T13:00:00.000Z",
    "2026-08-20T14:00:00.000Z",
    "2026-08-20T15:00:00.000Z",
  ]);
}

assertThrows(
  () =>
    distributeSmokedAts({
      from: to,
      to: from,
      count: 2,
      includeFrom: false,
      includeTo: true,
    }),
  /from/i
);

assertThrows(
  () =>
    distributeSmokedAts({
      from,
      to,
      count: 0,
      includeFrom: false,
      includeTo: true,
    }),
  /count/i
);

assertThrows(
  () =>
    distributeSmokedAts({
      from,
      to,
      count: 201,
      includeFrom: false,
      includeTo: true,
    }),
  /count/i
);

assertThrows(
  () =>
    distributeSmokedAts({
      from,
      to,
      count: 1.5,
      includeFrom: false,
      includeTo: true,
    }),
  /count/i
);

assertThrows(
  () =>
    distributeSmokedAts({
      from,
      to,
      count: 1,
      includeFrom: true,
      includeTo: true,
    }),
  /count/i
);

console.log("ok");
