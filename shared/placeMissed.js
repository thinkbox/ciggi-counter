// Places ciggis that were smoked from a pack but never logged.
//
// The anchor is the busiest session since the pack was opened: the run with
// the most ciggis, and the shortest run when counts tie. A gap longer than
// the median gap starts a new session, so a long quiet stretch stays a
// boundary instead of gluing two runs together.
//
// New times step out from both sides of that session at its average gap
// (never under 10 minutes), nearest first, left then right. A step that
// leaves the pack window or lands within 10 minutes of a ciggi is skipped.

const TEN_MIN_MS = 10 * 60 * 1000;
const MAX_STEPS = 100000;

function ciggisInWindow(smokedAts, windowStart, windowEnd) {
  const start = new Date(windowStart).getTime();
  const end = new Date(windowEnd).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
  return smokedAts.filter((iso) => {
    const time = new Date(iso).getTime();
    return Number.isFinite(time) && time >= start && time < end;
  });
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function sessionsFrom(times) {
  if (times.length === 0) return [];
  if (times.length === 1) return [times];
  const gaps = [];
  for (let index = 1; index < times.length; index += 1) {
    gaps.push(times[index] - times[index - 1]);
  }
  const splitAt = median(gaps);
  const sessions = [[times[0]]];
  for (let index = 1; index < times.length; index += 1) {
    if (times[index] - times[index - 1] > splitAt) sessions.push([]);
    sessions[sessions.length - 1].push(times[index]);
  }
  return sessions;
}

function busiestSession(sessions) {
  let best = sessions[0];
  for (const session of sessions.slice(1)) {
    const bestDuration = best[best.length - 1] - best[0];
    const duration = session[session.length - 1] - session[0];
    const more = session.length > best.length;
    const shorterTie = session.length === best.length && duration < bestDuration;
    const earlierTie =
      session.length === best.length && duration === bestDuration && session[0] < best[0];
    if (more || shorterTie || earlierTie) best = session;
  }
  return best;
}

function placeMissed({ inWindow = [], existing = inWindow, windowStart, windowEnd, count }) {
  const wanted = Number(count);
  if (!Number.isInteger(wanted) || wanted <= 0) return [];

  const startBound = new Date(windowStart).getTime();
  const endBound = new Date(windowEnd).getTime();
  if (!Number.isFinite(startBound) || !Number.isFinite(endBound) || endBound <= startBound) {
    return [];
  }

  const times = ciggisInWindow(inWindow, windowStart, windowEnd)
    .map((iso) => new Date(iso).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((left, right) => left - right);
  if (times.length === 0) return [];

  const session = busiestSession(sessionsFrom(times));
  const sessionStart = session[0];
  const sessionEnd = session[session.length - 1];
  const average =
    session.length < 2 ? TEN_MIN_MS : (sessionEnd - sessionStart) / (session.length - 1);
  const step = Math.max(average, TEN_MIN_MS);

  const blocked = existing
    .map((iso) => new Date(iso).getTime())
    .filter((time) => Number.isFinite(time));
  const accepted = [];

  function legal(time) {
    if (time < startBound || time >= endBound) return false;
    for (const other of blocked) {
      if (Math.abs(time - other) < TEN_MIN_MS) return false;
    }
    for (const other of accepted) {
      if (Math.abs(time - other) < TEN_MIN_MS) return false;
    }
    return true;
  }

  let leftDone = false;
  let rightDone = false;
  for (let stepIndex = 1; stepIndex <= MAX_STEPS && accepted.length < wanted; stepIndex += 1) {
    if (leftDone && rightDone) break;
    if (!leftDone) {
      const time = Math.round(sessionStart - stepIndex * step);
      if (time < startBound) leftDone = true;
      else if (legal(time)) accepted.push(time);
    }
    if (accepted.length >= wanted) break;
    if (!rightDone) {
      const time = Math.round(sessionEnd + stepIndex * step);
      if (time >= endBound) rightDone = true;
      else if (legal(time)) accepted.push(time);
    }
  }

  return accepted.map((time) => new Date(time).toISOString());
}

module.exports = { TEN_MIN_MS, ciggisInWindow, placeMissed };
