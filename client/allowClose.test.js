// Checks the five-minute confirmation flow without a real server.
const assert = require("node:assert/strict");
const { format } = require("date-fns");
const { formatCloseWarning, requestAllowingClose } = require("./allowClose");

function response({ status, body }) {
  const text = typeof body === "string" ? body : JSON.stringify(body ?? "");
  return {
    status,
    ok: status >= 200 && status < 300,
    statusText: "Error",
    clone() {
      return this;
    },
    json() {
      return Promise.resolve(JSON.parse(text));
    },
    text() {
      return Promise.resolve(text);
    },
  };
}

{
  const near = new Date(2026, 6, 5, 15, 42).toISOString();
  const label = format(new Date(near), "EEE, d MMM, h:mm a");
  const message = formatCloseWarning([
    { near },
    { near },
    { near: new Date(2026, 6, 5, 15, 40).toISOString() },
    { near: new Date(2026, 6, 5, 15, 30).toISOString() },
    { near: new Date(2026, 6, 5, 15, 20).toISOString() },
  ]);
  assert.ok(message.startsWith(`This is within 5 minutes of a ciggi at ${label}`));
  assert.ok(message.includes(" and 1 more"));
  assert.ok(message.endsWith("Log anyway?"));
}

async function main() {
{
  const calls = [];
  const saved = await requestAllowingClose(
    "/api/cigarettes",
    { smokedAt: "2026-10-14T00:00:00.000Z" },
    "POST",
    {
      confirm() {
        return true;
      },
      request(path, body, method) {
        calls.push({ path, body, method });
        if (calls.length === 1) {
          return Promise.resolve(
            response({
              status: 409,
              body: { code: "too_close", conflicts: [{ near: "2026-10-14T00:01:00.000Z" }] },
            }),
          );
        }
        return Promise.resolve(response({ status: 201, body: { id: "1" } }));
      },
    },
  );
  assert.equal(saved.status, 201);
  assert.equal(calls[1].body.allowClose, true);
  assert.equal(calls[1].method, "POST");
}

{
  let calls = 0;
  await assert.rejects(
    () =>
      requestAllowingClose("/api/cigarettes", { smokedAt: "x" }, undefined, {
        confirm() {
          return false;
        },
        request() {
          calls += 1;
          return Promise.resolve(
            response({ status: 409, body: { code: "too_close", conflicts: [] } }),
          );
        },
      }),
    (err) => err.cancelled === true,
  );
  assert.equal(calls, 1);
}

{
  await assert.rejects(
    () =>
      requestAllowingClose("/api/cigarettes/multi", {}, "POST", {
        confirm() {
          return true;
        },
        request() {
          return Promise.resolve(
            response({ status: 400, body: { error: "from must be before to" } }),
          );
        },
      }),
    (err) => err.message === "from must be before to",
  );
}

console.log("allowClose.test.js passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
