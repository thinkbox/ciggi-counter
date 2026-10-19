// Form parsing for a new pack. Cost is kept as text until it is cents,
// so "10.20" does not become a binary float.

const { ciggisInWindow } = require("../shared/placeMissed");

function dollarsToCents(input) {
  const text = String(input ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const [whole, frac = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  if (cents > 1_000_000) return null;
  return cents;
}

function formatPackCost(cents) {
  const amount = Number.isInteger(cents) ? cents : 0;
  return `$${(amount / 100).toFixed(2)}`;
}

function selectedPackSize(choice, custom) {
  if (choice === "custom") {
    if (!/^\d+$/.test(String(custom ?? "").trim())) return null;
    const size = Number(custom);
    if (size < 1 || size > 100) return null;
    return size;
  }
  const size = Number(choice);
  if (size === 20 || size === 25 || size === 30 || size === 40) return size;
  return null;
}

function packShortfall(previous, smokedAts, openedAt) {
  if (!previous) return { logged: 0, missing: 0 };
  const logged = ciggisInWindow(smokedAts, previous.openedAt, openedAt).length;
  return { logged, missing: Math.max(0, previous.size - logged) };
}

module.exports = { dollarsToCents, formatPackCost, packShortfall, selectedPackSize };
