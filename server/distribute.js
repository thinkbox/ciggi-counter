function distributeSmokedAts({ from, to, count, includeFrom, includeTo }) {
  const start = new Date(from).getTime();
  const end = new Date(to).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    throw new Error("from must be before to");
  }
  if (!Number.isInteger(count) || count < 1 || count > 200) {
    throw new Error("count must be an integer from 1 to 200");
  }
  if (includeFrom && includeTo && count < 2) {
    throw new Error("count must be at least 2 when both endpoints are included");
  }

  const duration = end - start;
  const times = [];
  for (let i = 0; i < count; i++) {
    let t;
    if (includeFrom && includeTo) {
      t = start + (i * duration) / (count - 1);
    } else if (includeFrom) {
      t = start + (i * duration) / count;
    } else if (includeTo) {
      t = start + ((i + 1) * duration) / count;
    } else {
      t = start + ((i + 1) * duration) / (count + 1);
    }
    times.push(new Date(Math.round(t)).toISOString());
  }
  return times;
}

module.exports = { distributeSmokedAts };
