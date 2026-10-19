const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { placeMissed } = require("../shared/placeMissed");

const tmpDb = path.join(os.tmpdir(), `cigicounter-packs-${process.pid}.db`);
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

function plus(iso, minutes) {
  return new Date(new Date(iso).getTime() + minutes * 60000).toISOString();
}

async function main() {
  const opened = "2026-01-10T00:00:00.000Z";
  const created = await request("POST", "/api/packs", {
    brand: "Winfield",
    size: 20,
    costCents: 4550,
    openedAt: opened,
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.brand, "Winfield");
  assert.equal(created.body.costCents, 4550);

  const reused = await request("POST", "/api/packs", {
    brand: "winfield",
    size: 25,
    costCents: 5000,
    openedAt: "2026-01-12T00:00:00.000Z",
  });
  assert.equal(reused.status, 201);
  assert.equal(reused.body.brand, "Winfield");

  const brands = await request("GET", "/api/brands");
  assert.equal(brands.status, 200);
  assert.equal(brands.body.length, 1);
  assert.equal(brands.body[0].name, "Winfield");

  const packs = await request("GET", "/api/packs");
  assert.equal(packs.body.length, 2);
  assert.equal(packs.body[0].openedAt, "2026-01-12T00:00:00.000Z");
  assert.equal(packs.body[0].open, true);
  assert.equal(packs.body[0].durationMs, null);
  assert.equal(packs.body[1].open, false);
  assert.equal(packs.body[1].durationMs, 2 * 24 * 60 * 60 * 1000);
  assert.equal(packs.body[1].brand, "Winfield");

  const future = await request("POST", "/api/packs", {
    brand: "Winfield",
    size: 20,
    costCents: 100,
    openedAt: "2099-01-01T00:00:00.000Z",
  });
  assert.equal(future.status, 400);

  const before = await request("POST", "/api/packs", {
    brand: "Winfield",
    size: 20,
    costCents: 100,
    openedAt: "2026-01-11T00:00:00.000Z",
  });
  assert.equal(before.status, 400);
  assert.match(before.body.error, /after the previous pack/);

  const packStart = "2026-02-01T08:00:00.000Z";
  const first = await request("POST", "/api/packs", {
    brand: "Benson",
    size: 5,
    costCents: 2000,
    openedAt: packStart,
    toAdd: 0,
    missed: [],
  });
  assert.equal(first.status, 201);

  const smoked = [plus(packStart, 60), plus(packStart, 80), plus(packStart, 100)];
  for (const smokedAt of smoked) {
    const logged = await request("POST", "/api/cigarettes", { smokedAt });
    assert.equal(logged.status, 201);
  }

  const nextOpen = plus(packStart, 360);
  const expected = placeMissed({
    inWindow: smoked,
    existing: smoked,
    windowStart: packStart,
    windowEnd: nextOpen,
    count: 1,
  });
  assert.equal(expected.length, 1);

  const caught = await request("POST", "/api/packs", {
    brand: "Benson",
    size: 20,
    costCents: 2100,
    openedAt: nextOpen,
    toAdd: 1,
    missed: expected,
  });
  assert.equal(caught.status, 201);
  assert.equal(caught.body.missed.length, 1);
  assert.equal(caught.body.missed[0].smokedAt, expected[0]);

  const afterCatch = await request("GET", "/api/packs");
  const closed = afterCatch.body.find((pack) => pack.openedAt === packStart);
  assert.equal(closed.givenAway, 1);
  assert.equal(closed.smoked, 4);
  assert.equal(closed.size, 5);

  const ciggis = await request("GET", "/api/cigarettes");
  assert.equal(ciggis.body.length, 4);

  const outside = await request("POST", "/api/packs", {
    brand: "Benson",
    size: 20,
    costCents: 2100,
    openedAt: plus(nextOpen, 600),
    toAdd: 1,
    missed: [plus(packStart, -30)],
  });
  assert.equal(outside.status, 400);
  assert.match(outside.body.error, /outside the pack/);
  const afterOutside = await request("GET", "/api/packs");
  assert.equal(afterOutside.body.length, afterCatch.body.length);
  const ciggisAfter = await request("GET", "/api/cigarettes");
  assert.equal(ciggisAfter.body.length, 4);

  const tightStart = "2026-04-01T10:00:00.000Z";
  const tight = await request("POST", "/api/packs", {
    brand: "Benson",
    size: 3,
    costCents: 100,
    openedAt: tightStart,
  });
  assert.equal(tight.status, 201);
  const only = plus(tightStart, 5);
  assert.equal((await request("POST", "/api/cigarettes", { smokedAt: only })).status, 201);
  const tightEnd = plus(tightStart, 12);
  const noneFit = placeMissed({
    inWindow: [only],
    existing: (await request("GET", "/api/cigarettes")).body.map((row) => row.smokedAt),
    windowStart: tightStart,
    windowEnd: tightEnd,
    count: 2,
  });
  assert.deepEqual(noneFit, []);
  const unplaced = await request("POST", "/api/packs", {
    brand: "Benson",
    size: 20,
    costCents: 100,
    openedAt: tightEnd,
    toAdd: 2,
    missed: [],
  });
  assert.equal(unplaced.status, 201);
  const tightPack = (await request("GET", "/api/packs")).body.find(
    (pack) => pack.openedAt === tightStart
  );
  assert.equal(tightPack.givenAway, 0);
  assert.equal(tightPack.smoked, 1);

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
