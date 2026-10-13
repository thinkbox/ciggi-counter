const crypto = require("crypto");
const { Router } = require("express");
const db = require("./db");
const { distributeSmokedAts } = require("./distribute");
const { closeConflicts } = require("./closeCiggis");
const {
  isRealDay,
  isValidGoal,
  listDailyGoals,
  localToday,
  upsertDailyGoal,
} = require("./dailyGoals");

const router = Router();

function tooCloseResponse(candidates, allowClose, excludeId) {
  if (allowClose === true) return null;
  const existing = (
    excludeId
      ? db
          .prepare("SELECT smoked_at AS smokedAt FROM cigarettes WHERE id != ?")
          .all(excludeId)
      : db.prepare("SELECT smoked_at AS smokedAt FROM cigarettes").all()
  ).map((row) => row.smokedAt);
  const conflicts = closeConflicts(existing, candidates);
  if (conflicts.length === 0) return null;
  return { code: "too_close", conflicts };
}

function nextId() {
  return crypto.randomUUID();
}

router.get("/cigarettes", (_req, res) => {
  const cigarettes = db
    .prepare(
      "SELECT id, smoked_at AS smokedAt FROM cigarettes ORDER BY smoked_at"
    )
    .all();
  res.json(cigarettes);
});

router.post("/cigarettes", (req, res) => {
  const { smokedAt, allowClose } = req.body;
  const blocked = tooCloseResponse([smokedAt], allowClose);
  if (blocked) return res.status(409).json(blocked);
  const record = { id: nextId(), smokedAt };
  db.prepare(
    "INSERT INTO cigarettes (id, smoked_at) VALUES (@id, @smokedAt)"
  ).run(record);
  res.status(201).json(record);
});

router.post("/cigarettes/multi", (req, res) => {
  const { from, to, count, includeFrom, includeTo, allowClose } = req.body ?? {};
  let smokedAts;
  try {
    smokedAts = distributeSmokedAts({
      from,
      to,
      count: Number(count),
      includeFrom: includeFrom === true,
      includeTo: includeTo === true,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const blocked = tooCloseResponse(smokedAts, allowClose);
  if (blocked) return res.status(409).json(blocked);

  const insert = db.prepare(
    "INSERT INTO cigarettes (id, smoked_at) VALUES (@id, @smokedAt)"
  );
  const records = smokedAts.map((smokedAt) => ({ id: nextId(), smokedAt }));

  db.exec("BEGIN");
  try {
    for (const record of records) {
      insert.run(record);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  res.status(201).json(records);
});

router.put("/cigarettes/:id", (req, res) => {
  const { smokedAt, allowClose } = req.body ?? {};
  if (!smokedAt || Number.isNaN(new Date(smokedAt).getTime())) {
    return res.status(400).json({ error: "Invalid smokedAt" });
  }
  const existing = db
    .prepare("SELECT id FROM cigarettes WHERE id = ?")
    .get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const blocked = tooCloseResponse([smokedAt], allowClose, req.params.id);
  if (blocked) return res.status(409).json(blocked);

  db.prepare("UPDATE cigarettes SET smoked_at = ? WHERE id = ?").run(
    smokedAt,
    req.params.id
  );
  res.json({ id: req.params.id, smokedAt });
});

router.delete("/cigarettes/:id", (req, res) => {
  db.prepare("DELETE FROM cigarettes WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

router.get("/settings/daily-goal", (_req, res) => {
  res.json({ goals: listDailyGoals(db) });
});

router.put("/settings/daily-goal", (req, res) => {
  const { day, dailyGoal } = req.body ?? {};
  if (!isRealDay(day) || !isValidGoal(dailyGoal)) {
    return res.status(400).json({ error: "Invalid daily goal" });
  }
  upsertDailyGoal(db, day, dailyGoal);
  res.json({ day, dailyGoal });
});

router.post("/migrate", (req, res) => {
  const count = db.prepare("SELECT COUNT(*) AS count FROM cigarettes").get()
    .count;
  if (count > 0) {
    return res.json({ migrated: false, reason: "already_has_data" });
  }

  const { cigarettes = [], settings = {} } = req.body;

  const insert = db.prepare(
    "INSERT INTO cigarettes (id, smoked_at) VALUES (@id, @smokedAt)"
  );

  db.exec("BEGIN");
  try {
    for (const c of cigarettes) {
      insert.run({ id: c.id, smokedAt: c.smokedAt });
    }
    if (isValidGoal(settings.dailyGoal)) {
      db.prepare(
        "INSERT OR IGNORE INTO daily_goals (day, goal) VALUES (?, ?)"
      ).run(localToday(), settings.dailyGoal);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  res.json({ migrated: true });
});

module.exports = router;
