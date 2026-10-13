const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");

const tmpDb = path.join(os.tmpdir(), `cigicounter-update-${process.pid}.db`);
process.env.CIGICOUNTER_DB = tmpDb;
for (const extra of [`${tmpDb}-wal`, `${tmpDb}-shm`]) {
  try {
    fs.unlinkSync(extra);
  } catch (_) {}
}
try {
  fs.unlinkSync(tmpDb);
} catch (_) {}

const express = require("express");
const routes = require("./routes");
const db = require("./db");

const app = express();
app.use(express.json());
app.use("/api", routes);

function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      const payload = body === undefined ? null : JSON.stringify(body);
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port,
          path: urlPath,
          method,
          headers: payload
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(payload),
              }
            : {},
        },
        (res) => {
          let raw = "";
          res.on("data", (chunk) => {
            raw += chunk;
          });
          res.on("end", () => {
            server.close();
            let parsed = null;
            if (raw) {
              try {
                parsed = JSON.parse(raw);
              } catch (_) {
                parsed = raw;
              }
            }
            resolve({ status: res.statusCode, body: parsed });
          });
        }
      );
      req.on("error", (err) => {
        server.close();
        reject(err);
      });
      if (payload) req.write(payload);
      req.end();
    });
  });
}

async function main() {
  const created = await request("POST", "/api/cigarettes", {
    smokedAt: "2026-10-11T07:00:00.000Z",
  });
  assert.equal(created.status, 201);
  const id = created.body.id;

  const other = await request("POST", "/api/cigarettes", {
    smokedAt: "2026-10-11T09:00:00.000Z",
  });
  assert.equal(other.status, 201);

  const updated = await request("PUT", `/api/cigarettes/${id}`, {
    smokedAt: "2026-10-11T08:00:00.000Z",
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.id, id);
  assert.equal(updated.body.smokedAt, "2026-10-11T08:00:00.000Z");

  const listed = await request("GET", "/api/cigarettes");
  const row = listed.body.find((cigarette) => cigarette.id === id);
  assert.equal(row.smokedAt, "2026-10-11T08:00:00.000Z");

  const missing = await request("PUT", "/api/cigarettes/missing", {
    smokedAt: "2026-10-11T08:30:00.000Z",
  });
  assert.equal(missing.status, 404);

  const invalid = await request("PUT", `/api/cigarettes/${id}`, {
    smokedAt: "not-a-date",
  });
  assert.equal(invalid.status, 400);

  const tooClose = await request("PUT", `/api/cigarettes/${id}`, {
    smokedAt: "2026-10-11T08:58:00.000Z",
  });
  assert.equal(tooClose.status, 409);
  assert.equal(tooClose.body.code, "too_close");

  const sameTime = await request("PUT", `/api/cigarettes/${id}`, {
    smokedAt: "2026-10-11T08:00:00.000Z",
  });
  assert.equal(sameTime.status, 200);

  const allowed = await request("PUT", `/api/cigarettes/${id}`, {
    smokedAt: "2026-10-11T08:58:00.000Z",
    allowClose: true,
  });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.body.smokedAt, "2026-10-11T08:58:00.000Z");

  console.log("ok");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => {
    try {
      db.close();
    } catch (_) {}
    try {
      fs.unlinkSync(tmpDb);
    } catch (_) {}
  });
