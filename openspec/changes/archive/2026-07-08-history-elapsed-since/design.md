## Context

The history screen (`/history`) renders each cigarette as a card row with:

- Date: `Vc(smokedAt, "EEE d MMM yyyy")` — `data-testid="text-date-{id}"`
- Time: `Vc(smokedAt, "h:mm a")` — `data-testid="text-time-{id}"` in muted foreground
- Delete button on the right

Entries are sorted newest-first at render time. The dashboard already has elapsed-time formatting via `Iz` (and the in-progress `elapsed-hours-with-minutes` change adds `{hours}hrs {minutes}m` for durations ≥ 1 hour). The app's theme primary colour is orange (`--primary: 25 80% 45%`), exposed as Tailwind `text-primary`.

The React frontend ships as a pre-built bundle in `assets/` with no source in the repo.

## Goals / Non-Goals

**Goals:**

- Show elapsed gap since the previous cigarette below each entry's time, in orange
- Format consistently with dashboard elapsed rules
- Preserve existing date, time, sort order, delete, and empty state

**Non-Goals:**

- Showing elapsed time from each entry to now (that is the dashboard's job)
- Changing history sort order or API behaviour
- Adding elapsed display to other screens
- Restoring full frontend source
- Live-refreshing elapsed gaps (gaps between fixed timestamps are static)

## Decisions

### 1. Per-entry elapsed as gap since previous cigarette

**Choice:** For each history row at index `S` in the newest-first sorted list, compute elapsed as `new Date(entry.smokedAt) - new Date(previousEntry.smokedAt)` where `previousEntry` is the next item in the array (`sorted[S + 1]`). The oldest entry (last row) shows `"— "`.

**Rationale:** Users want to see how long it had been between consecutive smokes. The top row shows the gap between the two most recent cigarettes (e.g. "2hrs 20m").

**Alternative considered:** Elapsed from `smokedAt` to now — rejected; that duplicates the dashboard and does not answer "how long since the last one before this?"

### 2. Shared formatters extracted from `Iz`

**Choice:** Add two helpers:

- `fmtElapsedSince(smokedAt)` — for dashboard: `Date.now() - smokedAt`
- `fmtElapsedBetween(earlier, later)` — for history gaps: `later - earlier`

Both use the same formatting rules:

- ≥ 1 hour → `{hours}hrs {minutes}m`
- < 1 hour → `kz(smokedAt, { addSuffix: true })` (history) / relative format with suffix

**Rationale:** Keeps dashboard and history formatting consistent; avoids duplicating the hour/minute branch.

### 3. Orange styling via `text-primary`

**Choice:** Style the elapsed line with `text-sm text-primary font-tabular` (orange in this theme).

**Rationale:** `text-orange-*` utilities are not in the built CSS bundle; `text-primary` is the app's orange brand colour and already available.

**Layout:**

```
Wed 8 Jul 2026          [delete]
3:42 pm                 (existing muted time)
2hrs 20m               (new, orange — gap since previous smoke)
```

### 4. No live refresh on history screen

**Choice:** Do not add a tick interval on the history screen. Gaps between fixed past timestamps do not change over time.

**Rationale:** Unlike the dashboard "time since last ciggi", history gaps are historical and static once rendered. A `setInterval` would add unnecessary re-renders with no user-visible benefit.

### 5. Bundle patch at history list `.map`

**Choice:** Change `.map(m => ...)` to `.map((m, S, b) => ...)` on the sorted array. Insert a third `<p>` below `text-time-{id}` showing `fmtElapsedBetween(b[S+1].smokedAt, m.smokedAt)` when `S < b.length - 1`, else `"— "`.

**Rationale:** Minimal, localised change; consistent with prior bundle patches.

**Test id:** `data-testid="text-elapsed-{id}"` for verification.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Bundle patch fragility | Target known `text-time-{id}` structure; smoke-test after edit |
| Formatter drift from dashboard `Iz` | Extract shared helpers; `Iz` calls `fmtElapsedSince` |
| `text-primary` vs literal orange | Primary IS orange in theme; document in spec |
| Oldest row shows dash | Document in spec; expected when no prior entry exists |

## Migration Plan

No migration. Frontend-only additive UI change. Deploy updated bundle.

## Open Questions

None.
