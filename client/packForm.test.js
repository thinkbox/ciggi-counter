const assert = require("node:assert/strict");
const {
  brandFields,
  centsToCostInput,
  dollarsToCents,
  formatPackCost,
  neighborOpenTimes,
  packEditTimeError,
  packShortfall,
  packSizeFields,
  selectedPackSize,
} = require("./packForm");

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

assert.equal(centsToCostInput(4550), "45.50");
assert.equal(centsToCostInput(1020), "10.20");
assert.equal(centsToCostInput(5), "0.05");

assert.deepEqual(packSizeFields(25), { sizeChoice: "25", customSize: "" });
assert.deepEqual(packSizeFields(40), { sizeChoice: "40", customSize: "" });
assert.deepEqual(packSizeFields(18), { sizeChoice: "custom", customSize: "18" });

assert.deepEqual(brandFields("Winfield", [{ id: "a", name: "Winfield" }]), {
  brandId: "a",
  brandText: "",
});
assert.deepEqual(brandFields("winfield", [{ id: "a", name: "Winfield" }]), {
  brandId: "a",
  brandText: "",
});
assert.deepEqual(brandFields("Alpine", [{ id: "a", name: "Winfield" }]), {
  brandId: "new",
  brandText: "Alpine",
});
assert.deepEqual(brandFields("Alpine", []), { brandId: "", brandText: "Alpine" });

const packs = [
  { id: "new", openedAt: "2026-06-20T00:00:00.000Z" },
  { id: "mid", openedAt: "2026-06-10T00:00:00.000Z" },
  { id: "old", openedAt: "2026-06-01T00:00:00.000Z" },
];
assert.deepEqual(neighborOpenTimes(packs, "mid"), {
  previousOpenedAt: "2026-06-01T00:00:00.000Z",
  nextOpenedAt: "2026-06-20T00:00:00.000Z",
});
assert.deepEqual(neighborOpenTimes(packs, "new"), {
  previousOpenedAt: "2026-06-10T00:00:00.000Z",
  nextOpenedAt: null,
});
assert.deepEqual(neighborOpenTimes(packs, "old"), {
  previousOpenedAt: null,
  nextOpenedAt: "2026-06-10T00:00:00.000Z",
});

const now = new Date("2026-07-01T00:00:00.000Z").getTime();
assert.equal(
  packEditTimeError({
    openedAt: "2026-06-12T00:00:00.000Z",
    previousOpenedAt: "2026-06-01T00:00:00.000Z",
    nextOpenedAt: "2026-06-20T00:00:00.000Z",
    now,
  }),
  null,
);
assert.match(
  packEditTimeError({
    openedAt: "2026-08-01T00:00:00.000Z",
    previousOpenedAt: null,
    nextOpenedAt: null,
    now,
  }),
  /future/,
);
assert.match(
  packEditTimeError({
    openedAt: "2026-06-01T00:00:00.000Z",
    previousOpenedAt: "2026-06-01T00:00:00.000Z",
    nextOpenedAt: "2026-06-20T00:00:00.000Z",
    now,
  }),
  /previous pack/,
);
assert.match(
  packEditTimeError({
    openedAt: "2026-06-20T00:00:00.000Z",
    previousOpenedAt: "2026-06-01T00:00:00.000Z",
    nextOpenedAt: "2026-06-20T00:00:00.000Z",
    now,
  }),
  /next pack/,
);

console.log("ok");
