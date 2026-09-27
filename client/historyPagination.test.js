const assert = require("node:assert/strict");
const {
  localDayKey,
  paginateHistory,
  pageIndexForId,
  nearestDayKey,
} = require("./historyPagination");

function at(y, m, d, h = 12, min = 0, s = 0, ms = 0) {
  return new Date(y, m - 1, d, h, min, s, ms).toISOString();
}

function cig(id, iso) {
  return { id, smokedAt: iso };
}

{
  const iso = new Date(2026, 8, 28, 23, 30).toISOString();
  assert.equal(localDayKey(iso), "2026-09-28");
}

{
  const cigarettes = [
    cig("a", at(2026, 9, 26, 8)),
    cig("b", at(2026, 9, 28, 10)),
    cig("c", at(2026, 9, 28, 18)),
    cig("d", at(2026, 9, 27, 9)),
  ];
  const page = paginateHistory({
    cigarettes,
    dayKey: null,
    pageSize: "all",
    pageIndex: 0,
  });

  assert.deepEqual(
    page.days.map((day) => day.key),
    ["2026-09-28", "2026-09-27", "2026-09-26"],
  );
  assert.deepEqual(
    page.days.map((day) => day.count),
    [2, 1, 1],
  );
  assert.equal(page.dayKey, "2026-09-28");
  assert.equal(page.dayCount, 2);
  assert.deepEqual(
    page.entries.map((entry) => entry.id),
    ["c", "b"],
  );
  assert.equal(page.pageIndex, 0);
  assert.equal(page.pageCount, 1);
  assert.equal(page.hasPrevDay, true);
  assert.equal(page.hasNextDay, false);
  assert.equal(page.showPager, false);
}

{
  const cigarettes = [];
  for (let i = 0; i < 25; i += 1) {
    cigarettes.push(cig(String(i), at(2026, 9, 28, 10, i)));
  }

  const first = paginateHistory({
    cigarettes,
    dayKey: "2026-09-28",
    pageSize: 10,
    pageIndex: 0,
  });
  assert.equal(first.dayCount, 25);
  assert.equal(first.pageCount, 3);
  assert.equal(first.showPager, true);
  assert.deepEqual(
    first.entries.map((entry) => entry.id),
    ["24", "23", "22", "21", "20", "19", "18", "17", "16", "15"],
  );

  const last = paginateHistory({
    cigarettes,
    dayKey: "2026-09-28",
    pageSize: 10,
    pageIndex: 2,
  });
  assert.equal(last.pageIndex, 2);
  assert.deepEqual(
    last.entries.map((entry) => entry.id),
    ["4", "3", "2", "1", "0"],
  );
}

{
  const page = paginateHistory({
    cigarettes: [
      cig("a", at(2026, 9, 28, 10)),
      cig("b", at(2026, 9, 28, 11)),
    ],
    dayKey: "2026-09-28",
    pageSize: "all",
    pageIndex: 5,
  });
  assert.equal(page.pageCount, 1);
  assert.equal(page.pageIndex, 0);
  assert.equal(page.showPager, false);
  assert.equal(page.entries.length, 2);
}

{
  const cigarettes = Array.from({ length: 12 }, (_, i) =>
    cig(String(i), at(2026, 9, 28, 8, i)),
  );
  const page = paginateHistory({
    cigarettes,
    dayKey: "2026-09-28",
    pageSize: 10,
    pageIndex: 9,
  });
  assert.equal(page.pageCount, 2);
  assert.equal(page.pageIndex, 1);
  assert.equal(page.entries.length, 2);
}

{
  const page = paginateHistory({
    cigarettes: [cig("a", at(2026, 9, 27, 8)), cig("b", at(2026, 9, 28, 8))],
    dayKey: "2026-09-01",
    pageSize: "all",
    pageIndex: 0,
  });
  assert.equal(page.dayKey, "2026-09-28");
}

{
  const page = paginateHistory({
    cigarettes: [],
    dayKey: null,
    pageSize: 10,
    pageIndex: 0,
  });
  assert.equal(page.dayKey, null);
  assert.deepEqual(page.days, []);
  assert.deepEqual(page.entries, []);
  assert.equal(page.dayCount, 0);
  assert.equal(page.pageIndex, 0);
  assert.equal(page.pageCount, 0);
  assert.equal(page.showPager, false);
  assert.equal(page.hasPrevDay, false);
  assert.equal(page.hasNextDay, false);
}

{
  const cigarettes = [
    cig("a", at(2026, 9, 26, 8)),
    cig("b", at(2026, 9, 28, 8)),
  ];
  const page = paginateHistory({
    cigarettes,
    dayKey: "2026-09-26",
    pageSize: "all",
    pageIndex: 0,
  });
  assert.deepEqual(
    page.days.map((day) => day.key),
    ["2026-09-28", "2026-09-26"],
  );
  assert.equal(page.hasPrevDay, false);
  assert.equal(page.hasNextDay, true);
}

{
  const cigarettes = Array.from({ length: 10 }, (_, i) =>
    cig(String(i), at(2026, 9, 28, 8, i)),
  );
  const page = paginateHistory({
    cigarettes,
    dayKey: "2026-09-28",
    pageSize: 10,
    pageIndex: 0,
  });
  assert.equal(page.showPager, false);
  assert.equal(page.pageCount, 1);
  assert.equal(page.entries.length, 10);
}

{
  const page = paginateHistory({
    cigarettes: Array.from({ length: 12 }, (_, i) =>
      cig(String(i), at(2026, 9, 28, 8, i)),
    ),
    dayKey: "2026-09-28",
    pageSize: "10",
    pageIndex: 0,
  });
  assert.equal(page.showPager, true);
  assert.equal(page.pageCount, 2);
  assert.equal(page.entries.length, 10);
}

{
  const entries = Array.from({ length: 25 }, (_, i) => ({ id: String(24 - i) }));
  assert.equal(pageIndexForId(entries, "24", 10), 0);
  assert.equal(pageIndexForId(entries, "14", 10), 1);
  assert.equal(pageIndexForId(entries, "0", 10), 2);
  assert.equal(pageIndexForId(entries, "0", "all"), 0);
  assert.equal(pageIndexForId(entries, "missing", 10), 0);
}

{
  const days = [
    { key: "2026-09-28" },
    { key: "2026-09-26" },
    { key: "2026-09-24" },
  ];
  assert.equal(nearestDayKey(days, "2026-09-27"), "2026-09-28");
  assert.equal(nearestDayKey(days, "2026-09-29"), "2026-09-28");
  assert.equal(nearestDayKey(days, "2026-09-23"), "2026-09-24");
  assert.equal(nearestDayKey(days, "2026-09-26"), "2026-09-26");
  assert.equal(nearestDayKey(days, "2026-09-25"), "2026-09-26");
  assert.equal(nearestDayKey([], "2026-09-26"), null);
}
