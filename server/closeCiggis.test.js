const assert = require("node:assert/strict");
const { closeConflicts } = require("./closeCiggis");

const FIVE_MIN = 5 * 60 * 1000;

{
  const conflicts = closeConflicts(
    ["2026-08-20T16:00:00.000Z"],
    ["2026-08-20T16:04:00.000Z"]
  );
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].at, "2026-08-20T16:04:00.000Z");
  assert.equal(conflicts[0].near, "2026-08-20T16:00:00.000Z");
  assert.equal(conflicts[0].gapMs, 4 * 60 * 1000);
}

{
  const conflicts = closeConflicts(
    ["2026-08-20T16:00:00.000Z"],
    ["2026-08-20T15:56:00.000Z"]
  );
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].gapMs, 4 * 60 * 1000);
}

{
  const conflicts = closeConflicts(
    ["2026-08-20T16:00:00.000Z"],
    ["2026-08-20T16:05:00.000Z"]
  );
  assert.deepEqual(conflicts, []);
}

{
  const conflicts = closeConflicts(
    [],
    ["2026-08-20T17:00:00.000Z", "2026-08-20T17:03:00.000Z"]
  );
  assert.equal(conflicts.length, 1);
  assert.ok(conflicts[0].gapMs < FIVE_MIN);
}

{
  const conflicts = closeConflicts(
    ["2026-08-20T12:00:00.000Z"],
    ["2026-08-20T18:00:00.000Z"]
  );
  assert.deepEqual(conflicts, []);
}

console.log("ok");
