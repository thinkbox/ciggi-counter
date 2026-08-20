const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");

const tmpDb = path.join(os.tmpdir(), `cigicounter-multi-${process.pid}.db`);
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
  const from = "2026-08-20T12:00:00.000Z";
  const to = "2026-08-20T16:00:00.000Z";

  const created = await request("POST", "/api/cigarettes/multi", {
    from,
    to,
    count: 4,
    includeFrom: false,
    includeTo: true,
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.length, 4);
  assert.deepEqual(
    created.body.map((row) => row.smokedAt),
    [
      "2026-08-20T13:00:00.000Z",
      "2026-08-20T14:00:00.000Z",
      "2026-08-20T15:00:00.000Z",
      "2026-08-20T16:00:00.000Z",
    ]
  );
  for (const row of created.body) {
    assert.equal(typeof row.id, "string");
    assert.ok(row.id.length > 0);
  }

  const listed = await request("GET", "/api/cigarettes");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.length, 4);

  const invalid = await request("POST", "/api/cigarettes/multi", {
    from: to,
    to: from,
    count: 4,
    includeFrom: false,
    includeTo: true,
  });
  assert.equal(invalid.status, 400);
  assert.equal(listed.body.length, 4);
  const afterInvalid = await request("GET", "/api/cigarettes");
  assert.equal(afterInvalid.body.length, 4);

  const bothOne = await request("POST", "/api/cigarettes/multi", {
    from,
    to,
    count: 1,
    includeFrom: true,
    includeTo: true,
  });
  assert.equal(bothOne.status, 400);
  const afterBoth = await request("GET", "/api/cigarettes");
  assert.equal(afterBoth.body.length, 4);

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
