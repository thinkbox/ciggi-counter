## Context

The dashboard top stats card shows "Time since last ciggi" with a live elapsed value (`data-testid="text-elapsed"`) refreshed every second via `setInterval`. The value is produced by `Iz(cigarettes)`, which sorts by `smokedAt`, takes the latest entry, and calls date-fns `formatDistance` (`kz`) with `{ addSuffix: true }`.

`formatDistance` rounds to the nearest unit at each threshold, so durations in the hour range display as whole hours only (e.g. "about 3 hours ago") with no minute component. The companion "Last ciggi at" absolute timestamp (added in a prior change) is unaffected by this work.

The React frontend ships as a pre-built bundle in `assets/` with no source in the repo.

## Goals / Non-Goals

**Goals:**

- When elapsed time is one hour or more, display whole hours plus remaining minutes (e.g. "3hrs 18m")
- Keep the 1-second live refresh, label, test id, empty state, and placement unchanged
- Update the minute component every 60 seconds (driven by the existing 1-second interval)

**Non-Goals:**

- Changing the "Last ciggi at" absolute timestamp display
- Showing seconds in the hours-level format
- Extending days/weeks/months formatting (durations under one hour and very long durations keep `formatDistance` behaviour)
- Restoring full frontend source as part of this change

## Decisions

### 1. Custom formatter for the hour range

**Choice:** Replace `kz(..., { addSuffix: true })` inside `Iz` with a branch: if elapsed ≥ 1 hour, compute hours and minutes manually; otherwise delegate to `kz` unchanged.

**Rationale:** `formatDistance` has no option to include sub-hour minutes when the primary unit is hours. A small custom branch is the minimal change.

**Computation:**

```
elapsedMs = Date.now() - lastSmokedAt.getTime()
hours     = Math.floor(elapsedMs / 3_600_000)
minutes   = Math.floor((elapsedMs % 3_600_000) / 60_000)
→ `${hours}hrs ${minutes}m`
```

**Alternative considered:** `formatDistanceStrict` with composite units — not bundled and would still need custom suffix styling.

### 2. Threshold: one hour and above only

**Choice:** Apply the custom format when `elapsedMs >= 3_600_000`; below that, keep existing `formatDistance` output (minutes, seconds, "less than a minute", etc.).

**Rationale:** Matches the user's request ("when hours are displayed"). Avoids redesigning sub-hour formatting that already works.

### 3. Format string

**Choice:** Use `{hours}hrs {minutes}m` — lowercase unit abbreviations, no "ago" suffix (the "Time since last ciggi" label provides context), minutes always shown (including `0m`).

**Examples:**

| Elapsed | Display |
|---------|---------|
| 3h 18m 12s | `3hrs 18m` |
| 1h 0m 45s | `1hrs 0m` |
| 45m 30s | `45 minutes ago` (unchanged, via `formatDistance`) |
| 0 cigarettes | `No ciggis logged` (unchanged) |

**Alternative considered:** Omit `0m` when minutes are zero — rejected for consistency and to avoid ambiguity with whole-hour rounding.

### 4. Bundle patch at `Iz`

**Choice:** Edit `function Iz` in `assets/index-D9dZHLx3.js` in place, same approach as prior dashboard changes.

**Rationale:** No frontend source in repo; `Iz` is already an isolated helper used only for the elapsed display.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Patching minified bundle is fragile | Target `function Iz` by name; smoke-test elapsed display after edit |
| `1hrs` reads awkwardly for singular | Acceptable per user's `3hrs` example; consistent rule |
| Very long durations show large hour counts (e.g. `72hrs 5m`) | Out of scope; `formatDistance` could be revisited separately for day+ ranges |
| Bundle patch breaks on next frontend rebuild | Document change location in tasks |

## Migration Plan

No migration. Frontend-only change to display formatting. Deploy updated bundle; no server restart required.

## Open Questions

None — scope and format are defined by the user's example.
