## Context

The dashboard top stats card shows "Time since last ciggi" with a live elapsed value (`data-testid="text-elapsed"`) refreshed every second via `setInterval`. That value is produced by `Iz` → `fmtElapsedSince`. History gap lines use `fmtElapsedBetween` with the same hour-range format.

Today the helpers branch at one hour:

- under 1 hour: date-fns `formatDistance` (`kz` / `jz`)
- ≥ 1 hour: `{hours}hrs {minutes}m`

There is no day-level branch, so a 36-hour streak displays as `36hrs 12m`. The companion "Last ciggi at" absolute timestamp is unaffected.

The React frontend ships as a pre-built bundle in `assets/` with no source in the repo.

## Goals / Non-Goals

**Goals:**

- When elapsed time is 24 hours or more, display whole days plus remaining hours (e.g. "1d 12hrs")
- Keep hours-and-minutes for durations of one hour up to (but not including) 24 hours
- Keep the 1-second live refresh, label, test id, empty state, and placement unchanged
- Apply the same three-band formatting to history elapsed-gap lines

**Non-Goals:**

- Changing the "Last ciggi at" absolute timestamp display
- Showing minutes or seconds in the day-level format
- Extending to weeks/months
- Restoring full frontend source as part of this change

## Decisions

### 1. Third band at 24 hours

**Choice:** Add a branch before the existing hour check: if elapsed ≥ 24 hours, compute days and remaining hours; else keep the current hour/minute and `formatDistance` paths.

**Rationale:** Minimal change to the existing helpers. Matches the user's request ("at the 24 hour mark displays in days and hours").

**Computation:**

```
elapsedMs = Date.now() - lastSmokedAt.getTime()
if elapsedMs >= 86_400_000:
  days  = Math.floor(elapsedMs / 86_400_000)
  hours = Math.floor((elapsedMs % 86_400_000) / 3_600_000)
  → `${days}d ${hours}hrs`
else if elapsedMs >= 3_600_000:
  existing hours + minutes
else:
  formatDistance
```

**Alternative considered:** Keep showing hours forever — rejected; that is the current problem.

### 2. Drop minutes once days are showing

**Choice:** The day-level format is `{days}d {hours}hrs` only. Hours are floored; leftover minutes are omitted (e.g. 25h 30m → `1d 1hrs`).

**Rationale:** The request is days and hours. Keeping minutes would make the day band as long as the hour band and less scannable.

**Alternative considered:** `{days}d {hours}hrs {minutes}m` — rejected to match "days and hours".

### 3. Always show the hours component

**Choice:** Always include `{hours}hrs`, including `0hrs` (e.g. `1d 0hrs` at exactly 24 hours, `2d 0hrs` at 48 hours).

**Rationale:** Matches the existing hours-band rule that always shows `0m`. Avoids a format that jumps between `1d` and `1d 3hrs`.

**Alternative considered:** Omit `0hrs` when remaining hours are zero — rejected for consistency with `0m`.

### 4. Format string

**Choice:** Use `{days}d {hours}hrs` — lowercase unit abbreviations, no "ago" suffix (the label provides context).

**Examples:**

| Elapsed | Display |
|---------|---------|
| 45m 30s | `45 minutes ago` (unchanged) |
| 3h 18m | `3hrs 18m` (unchanged) |
| 23h 59m | `23hrs 59m` (unchanged) |
| 24h 0m | `1d 0hrs` |
| 25h 30m | `1d 1hrs` |
| 36h 12m | `1d 12hrs` |
| 48h | `2d 0hrs` |
| 0 cigarettes | `No ciggis logged` (unchanged) |

### 5. Patch both shared helpers

**Choice:** Edit `fmtElapsedSince` and `fmtElapsedBetween` in `assets/index-D9dZHLx3.js` with the same 24-hour branch.

**Rationale:** History already requires dashboard-consistent formatting; both helpers currently duplicate the hour-range logic. `Iz` stays a thin wrapper around `fmtElapsedSince`.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Patching minified bundle is fragile | Target `fmtElapsedSince` and `fmtElapsedBetween` by name; smoke-test dashboard and history after edit |
| Floored hours hide leftover minutes after 24h (e.g. 25h 30m → `1d 1hrs`) | Accepted; day band is days and hours only |
| Very long durations never roll up to weeks | Out of scope; can be revisited separately |
| Bundle patch breaks on next frontend rebuild | Document change location in tasks |

## Migration Plan

No migration. Frontend-only change to display formatting. Deploy updated bundle; no server restart required.

## Open Questions

None — scope and format are defined by the approved plan.
