const FIVE_MIN_MS = 5 * 60 * 1000;

function closeConflicts(existingIso, candidateIso) {
  const existing = existingIso.map((smokedAt) => ({
    smokedAt,
    t: new Date(smokedAt).getTime(),
  }));
  const candidates = candidateIso.map((smokedAt) => ({
    smokedAt,
    t: new Date(smokedAt).getTime(),
  }));
  const conflicts = [];

  for (let i = 0; i < candidates.length; i++) {
    if (!Number.isFinite(candidates[i].t)) continue;
    for (const prev of existing) {
      if (!Number.isFinite(prev.t)) continue;
      const gapMs = Math.abs(candidates[i].t - prev.t);
      if (gapMs < FIVE_MIN_MS) {
        conflicts.push({
          at: candidates[i].smokedAt,
          near: prev.smokedAt,
          gapMs,
        });
      }
    }
    for (let j = i + 1; j < candidates.length; j++) {
      if (!Number.isFinite(candidates[j].t)) continue;
      const gapMs = Math.abs(candidates[i].t - candidates[j].t);
      if (gapMs < FIVE_MIN_MS) {
        conflicts.push({
          at: candidates[i].smokedAt,
          near: candidates[j].smokedAt,
          gapMs,
        });
      }
    }
  }

  return conflicts;
}

module.exports = { closeConflicts, FIVE_MIN_MS };
