const assert = require("node:assert/strict");
const { dollarsToCents, formatPackCost, packShortfall, selectedPackSize } = require("./packForm");

assert.equal(dollarsToCents("45.50"), 4550);
assert.equal(dollarsToCents("10.2"), 1020);
assert.equal(dollarsToCents("0"), 0);
assert.equal(dollarsToCents("10."), null);
assert.equal(dollarsToCents("10000.01"), null);
assert.equal(formatPackCost(4550), "$45.50");

assert.equal(selectedPackSize("25", ""), 25);
assert.equal(selectedPackSize("custom", "18"), 18);
assert.equal(selectedPackSize("custom", "0"), null);
assert.equal(selectedPackSize("custom", "101"), null);

{
  const previous = { openedAt: "2026-03-01T08:00:00.000Z", size: 20 };
  const smoked = [
    "2026-03-01T07:00:00.000Z",
    "2026-03-01T09:00:00.000Z",
    "2026-03-01T12:00:00.000Z",
  ];
  assert.deepEqual(packShortfall(previous, smoked, "2026-03-01T18:00:00.000Z"), {
    logged: 2,
    missing: 18,
  });
  assert.deepEqual(packShortfall(null, smoked, "2026-03-01T18:00:00.000Z"), {
    logged: 0,
    missing: 0,
  });
}

console.log("ok");
