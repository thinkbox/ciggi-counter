// Form parsing for opening or editing a pack. Cost is kept as text until
// it is cents, so "10.20" does not become a binary float. Packs in
// neighborOpenTimes are newest first, the same order the API returns.

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

function centsToCostInput(cents) {
  const amount = Number.isInteger(cents) ? cents : 0;
  return (amount / 100).toFixed(2);
}

function packSizeFields(size) {
  if (size === 20 || size === 25 || size === 30 || size === 40) {
    return { sizeChoice: String(size), customSize: "" };
  }
  return { sizeChoice: "custom", customSize: String(size) };
}

function brandFields(brandName, brands) {
  if (!brands.length) return { brandId: "", brandText: brandName };
  const match = brands.find(
    (brand) => brand.name.toLowerCase() === String(brandName ?? "").toLowerCase(),
  );
  if (!match) return { brandId: "new", brandText: brandName };
  return { brandId: match.id, brandText: "" };
}

function neighborOpenTimes(packs, packId) {
  const index = packs.findIndex((pack) => pack.id === packId);
  if (index === -1) return { previousOpenedAt: null, nextOpenedAt: null };
  return {
    previousOpenedAt: packs[index + 1]?.openedAt ?? null,
    nextOpenedAt: index > 0 ? packs[index - 1].openedAt : null,
  };
}

function packEditTimeError({ openedAt, previousOpenedAt, nextOpenedAt, now = Date.now() }) {
  const opened = new Date(openedAt).getTime();
  if (!Number.isFinite(opened)) return "Check the open time.";
  if (opened > now) return "Open time can't be in the future.";
  if (previousOpenedAt && opened <= new Date(previousOpenedAt).getTime()) {
    return "Open time must be after the previous pack.";
  }
  if (nextOpenedAt && opened >= new Date(nextOpenedAt).getTime()) {
    return "Open time must be before the next pack.";
  }
  return null;
}

module.exports = {
  brandFields,
  centsToCostInput,
  dollarsToCents,
  formatPackCost,
  neighborOpenTimes,
  packEditTimeError,
  packShortfall,
  packSizeFields,
  selectedPackSize,
};
