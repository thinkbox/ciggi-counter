const crypto = require("crypto");
const { Router } = require("express");
const db = require("./db");

const router = Router();

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
  const { smokedAt } = req.body;
  const record = { id: nextId(), smokedAt };
  db.prepare(
    "INSERT INTO cigarettes (id, smoked_at) VALUES (@id, @smokedAt)"
  ).run(record);
  res.status(201).json(record);
});

router.delete("/cigarettes/:id", (req, res) => {
  db.prepare("DELETE FROM cigarettes WHERE id = ?").run(req.params.id);
  res.status(204).send();
});

router.get("/settings/daily-goal", (_req, res) => {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'daily_goal'")
    .get();
  const dailyGoal = row ? JSON.parse(row.value) : null;
  res.json({ dailyGoal });
});

router.put("/settings/daily-goal", (req, res) => {
  const { dailyGoal } = req.body;
  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('daily_goal', @value) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run({ value: JSON.stringify(dailyGoal ?? null) });
  res.json({ dailyGoal });
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
    if (settings.dailyGoal != null) {
      db.prepare(
        "INSERT INTO settings (key, value) VALUES ('daily_goal', @value) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
      ).run({ value: JSON.stringify(settings.dailyGoal) });
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  res.json({ migrated: true });
});

module.exports = router;
