// Creates a pack and, when the previous pack was under-logged, the missed
// ciggis the review page already showed. Those times come from placeMissed
// so the highlighted cards and the saved rows are the same instants.
//
// given_away is the number the user said they did not smoke. Ciggis that
// would not fit with a 10 minute gap are left out and are not given away.

const crypto = require("crypto");
const { TEN_MIN_MS, ciggisInWindow, placeMissed } = require("../shared/placeMissed");

function listBrands(db) {
  return db.prepare("SELECT id, name FROM brands ORDER BY name COLLATE NOCASE").all();
}

function listPacks(db) {
  const packs = db
    .prepare(
      `SELECT packs.id, packs.size, packs.cost_cents AS costCents,
              packs.opened_at AS openedAt, packs.given_away AS givenAway,
              brands.name AS brand
       FROM packs
       JOIN brands ON brands.id = packs.brand_id
       ORDER BY packs.opened_at ASC`
    )
    .all();
  const times = db
    .prepare("SELECT smoked_at AS smokedAt FROM cigarettes")
    .all()
    .map((row) => new Date(row.smokedAt).getTime());

  const rows = packs.map((pack, index) => {
    const start = new Date(pack.openedAt).getTime();
    const next = packs[index + 1];
    const end = next ? new Date(next.openedAt).getTime() : null;
    const smoked = times.filter((time) => time >= start && (end == null || time < end)).length;
    return {
      id: pack.id,
      brand: pack.brand,
      size: pack.size,
      costCents: pack.costCents,
      openedAt: pack.openedAt,
      givenAway: pack.givenAway,
      smoked,
      closedAt: next ? next.openedAt : null,
      open: !next,
      durationMs: end == null ? null : end - start,
    };
  });
  rows.reverse();
  return rows;
}

function parseBrand(value) {
  if (typeof value !== "string") return null;
  const name = value.trim();
  if (!name || name.length > 60) return null;
  return name;
}

function parseSize(value) {
  if (!Number.isInteger(value) || value < 1 || value > 100) return null;
  return value;
}

function parseCostCents(value) {
  if (!Number.isInteger(value) || value < 0 || value > 1_000_000) return null;
  return value;
}

function parseTime(value) {
  if (typeof value !== "string") return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return time;
}

function sameTimes(left, right) {
  const stamp = (iso) => new Date(iso).getTime();
  const a = left.map(stamp).sort((x, y) => x - y);
  const b = right.map(stamp).sort((x, y) => x - y);
  if (a.length !== b.length) return false;
  return a.every((time, index) => time === b[index]);
}

function missedProblem(missed, existing, windowStart, windowEnd) {
  const times = [];
  for (const iso of missed) {
    const time = new Date(iso).getTime();
    if (!Number.isFinite(time) || time < windowStart || time >= windowEnd) {
      return "A missed ciggi is outside the pack or too close to another.";
    }
    for (const other of existing) {
      const at = new Date(other).getTime();
      if (Math.abs(time - at) < TEN_MIN_MS) {
        return "A missed ciggi is outside the pack or too close to another.";
      }
    }
    for (const other of times) {
      if (Math.abs(time - other) < TEN_MIN_MS) {
        return "A missed ciggi is outside the pack or too close to another.";
      }
    }
    times.push(time);
  }
  return null;
}

function findOrCreateBrand(db, name) {
  const existing = db
    .prepare("SELECT id, name FROM brands WHERE name = ? COLLATE NOCASE")
    .get(name);
  if (existing) return existing;
  const created = { id: crypto.randomUUID(), name };
  db.prepare("INSERT INTO brands (id, name) VALUES (?, ?)").run(created.id, created.name);
  return created;
}

function fail(error) {
  return { status: 400, body: { error } };
}

function createPack(db, body, now = Date.now()) {
  const brandName = parseBrand(body?.brand);
  const size = parseSize(body?.size);
  const costCents = parseCostCents(body?.costCents);
  const openedAtMs = parseTime(body?.openedAt);
  if (!brandName || size == null || costCents == null || openedAtMs == null) {
    return fail("Check the pack size, brand, cost, and open time.");
  }
  if (openedAtMs > now) return fail("Open time can't be in the future.");

  const missed = body?.missed == null ? [] : body.missed;
  if (!Array.isArray(missed)) return fail("Invalid missed ciggis.");

  const previous = db
    .prepare(
      `SELECT id, size, opened_at AS openedAt
       FROM packs
       ORDER BY opened_at DESC
       LIMIT 1`
    )
    .get();
  if (previous && openedAtMs <= new Date(previous.openedAt).getTime()) {
    return fail("Open time must be after the previous pack.");
  }

  const toAdd = body?.toAdd == null ? missed.length : body.toAdd;
  const all = db.prepare("SELECT smoked_at AS smokedAt FROM cigarettes").all().map((row) => row.smokedAt);

  let givenAway = 0;
  let expected = [];
  if (previous) {
    const windowStart = new Date(previous.openedAt).getTime();
    const inWindow = ciggisInWindow(all, previous.openedAt, openedAtMs);
    const missing = Math.max(0, previous.size - inWindow.length);
    if (!Number.isInteger(toAdd) || toAdd < 0 || toAdd > missing) {
      return fail("That missed count doesn't match this pack.");
    }
    const problem = missedProblem(missed, all, windowStart, openedAtMs);
    if (problem) return fail(problem);
    expected = placeMissed({
      inWindow,
      existing: all,
      windowStart: previous.openedAt,
      windowEnd: new Date(openedAtMs).toISOString(),
      count: toAdd,
    });
    if (!sameTimes(missed, expected)) {
      return fail("Those missed ciggis don't match this pack. Review them again.");
    }
    givenAway = missing - toAdd;
  } else if (toAdd !== 0 || missed.length > 0) {
    return fail("There is no previous pack to catch up.");
  }

  const openedAt = new Date(openedAtMs).toISOString();
  const insertCiggi = db.prepare("INSERT INTO cigarettes (id, smoked_at) VALUES (?, ?)");
  const records = expected.map((smokedAt) => ({ id: crypto.randomUUID(), smokedAt }));

  db.exec("BEGIN");
  try {
    const brand = findOrCreateBrand(db, brandName);
    for (const record of records) insertCiggi.run(record.id, record.smokedAt);
    if (previous) {
      db.prepare("UPDATE packs SET given_away = ? WHERE id = ?").run(givenAway, previous.id);
    }
    const pack = {
      id: crypto.randomUUID(),
      brand: brand.name,
      size,
      costCents,
      openedAt,
      givenAway: 0,
    };
    db.prepare(
      `INSERT INTO packs (id, brand_id, size, cost_cents, opened_at, given_away)
       VALUES (?, ?, ?, ?, ?, 0)`
    ).run(pack.id, brand.id, pack.size, pack.costCents, pack.openedAt);
    db.exec("COMMIT");
    return { status: 201, body: { ...pack, missed: records } };
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

module.exports = { createPack, listBrands, listPacks };
