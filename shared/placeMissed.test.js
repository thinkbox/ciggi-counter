const assert = require("node:assert/strict");
const { ciggisInWindow, placeMissed } = require("./placeMissed");

const day = "2026-03-01T";

function at(hours, minutes) {
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  return `${day}${h}:${m}:00.000Z`;
}

function placed(input) {
  return placeMissed({
    windowStart: input.windowStart ?? at(8, 0),
    windowEnd: input.windowEnd ?? at(18, 0),
    existing: input.existing ?? input.inWindow,
    count: input.count,
    inWindow: input.inWindow,
  });
}

{
  const inWindow = [at(10, 0), at(10, 25), at(10, 50), at(11, 15)];
  assert.deepEqual(
    placed({ inWindow, count: 4 }),
    [at(9, 35), at(11, 40), at(9, 10), at(12, 5)],
  );
}

{
  // A tight pair must not beat the longer run that has more ciggis.
  const inWindow = [at(10, 0), at(10, 40), at(11, 20), at(12, 0), at(17, 0), at(17, 10)];
  assert.equal(placed({ inWindow, count: 1 })[0], at(9, 20));
}

{
  // Same count: the shorter session is the anchor.
  const inWindow = [at(8, 0), at(9, 0), at(10, 0), at(13, 0), at(13, 15), at(13, 30)];
  assert.equal(placed({ inWindow, count: 1 })[0], at(12, 45));
}

{
  // A gap equal to the median stays in the session, so the step is 30 minutes.
  const inWindow = [at(10, 0), at(10, 30), at(11, 0)];
  assert.equal(placed({ inWindow, count: 1 })[0], at(9, 30));
}

{
  // 11:00 is only five minutes from the stray ciggi, so that step is skipped
  // and the right side continues outward.
  const inWindow = [at(10, 0), at(10, 30), at(11, 5)];
  assert.deepEqual(placed({ inWindow, count: 3 }), [at(9, 30), at(9, 0), at(11, 30)]);
}

{
  const inWindow = [at(10, 0), at(10, 30)];
  const result = placed({
    inWindow,
    windowStart: at(9, 50),
    windowEnd: at(11, 20),
    count: 3,
  });
  assert.deepEqual(result, [at(11, 0)]);
}

{
  // Exactly ten minutes from an outside ciggi is allowed.
  const inWindow = [at(10, 0)];
  const existing = [at(9, 40), at(10, 0)];
  assert.deepEqual(
    placed({ inWindow, existing, windowStart: at(9, 45), count: 1 }),
    [at(9, 50)],
  );
}

{
  const inWindow = [at(10, 0)];
  const existing = [at(9, 41), at(10, 0)];
  assert.deepEqual(
    placed({ inWindow, existing, windowStart: at(9, 45), count: 1 }),
    [at(10, 10)],
  );
}

{
  assert.deepEqual(placed({ inWindow: [], count: 4 }), []);
  assert.deepEqual(placed({ inWindow: [at(10, 0)], count: 0 }), []);
}

{
  const kept = ciggisInWindow(
    [at(7, 59), at(8, 0), at(12, 0), at(18, 0)],
    at(8, 0),
    at(18, 0),
  );
  assert.deepEqual(kept, [at(8, 0), at(12, 0)]);
}

console.log("ok");
