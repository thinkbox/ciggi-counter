// Checks the elapsed-time wording. Run with `npm test`.
const assert = require("node:assert/strict");
const { format, formatDistance } = require("date-fns");
const {
  formatElapsedSince,
  formatElapsedLabel,
  formatElapsedBetween,
  formatLastCiggiAt,
} = require("./timeFormat");

const now = new Date(2026, 9, 14, 15, 0, 0).getTime();

assert.equal(
  formatElapsedSince(new Date(now - 90 * 60 * 1000).toISOString(), now),
  "1hrs 30m",
);
assert.equal(
  formatElapsedSince(new Date(now - 36 * 60 * 60 * 1000).toISOString(), now),
  "1d 12hrs",
);

{
  const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
  assert.equal(
    formatElapsedSince(thirtyMinutesAgo.toISOString(), now),
    formatDistance(thirtyMinutesAgo, new Date(now), { addSuffix: true }),
  );
}

assert.equal(formatElapsedLabel([], now), "No ciggis logged");
assert.equal(formatLastCiggiAt([]), "— ");

{
  const smoked = new Date(2026, 6, 5, 15, 42);
  assert.equal(
    formatLastCiggiAt([{ smokedAt: smoked.toISOString() }]),
    format(smoked, "EEE, d MMM, h:mm a"),
  );
}

assert.equal(
  formatElapsedBetween(
    new Date(now).toISOString(),
    new Date(now - 1000).toISOString(),
  ),
  "— ",
);
assert.equal(
  formatElapsedBetween(
    new Date(now - 36 * 60 * 60 * 1000).toISOString(),
    new Date(now).toISOString(),
  ),
  "1d 12hrs",
);

console.log("timeFormat.test.js passed");
