## Context

Ciggi Counter stores cigarettes with ISO `smokedAt` timestamps. The backend returns them via `GET /api/cigarettes` with `ORDER BY smoked_at` (ascending). The React frontend (bundled in `assets/`) renders a history screen that currently displays entries in API order — oldest at the top, newest at the bottom. The app also uses the same cigarette data for charts and daily-count calculations, which depend on chronological ordering.

## Goals / Non-Goals

**Goals:**

- Show the history list newest-first so recent smokes are immediately visible
- Keep API response order unchanged to avoid breaking charts and aggregations
- Ensure live updates (new log, delete) maintain correct history order

**Non-Goals:**

- Changing the backend SQL sort order
- Adding sort controls or user-configurable ordering
- Reordering data in shared global state (only the history view's display order changes)
- Grouping history by day (future enhancement)

## Decisions

### 1. Reverse at render time in history view only

**Choice:** In the history component, derive display list as `[...cigarettes].reverse()` (or equivalent sort by `smokedAt` descending) at render time. Leave the shared cigarette state array in API order.

**Rationale:** Charts (recharts) and time-series views expect ascending chronological data. Mutating global state or changing the API would require auditing every consumer in the minified bundle. Scoping the reversal to the history render path is the smallest, safest change.

**Alternative considered:** Change API to `ORDER BY smoked_at DESC` — rejected because it risks breaking chart x-axis ordering and any code assuming `.at(-1)` is the latest entry.

**Alternative considered:** Add `?sort=desc` query param — rejected as unnecessary complexity for a single-user app with one sort preference.

### 2. Use stable descending sort, not in-place mutation

**Choice:** Create a reversed copy for rendering: `const historyItems = [...cigarettes].sort((a, b) => b.smokedAt.localeCompare(a.smokedAt))`.

**Rationale:** `.reverse()` works when API order is guaranteed ascending, but explicit descending sort by `smokedAt` is safer if order ever changes and avoids mutating the source array.

### 3. Delete behavior unchanged

**Choice:** Deleting an entry removes it from state; the history view re-renders with the same descending sort. No special handling needed.

**Rationale:** Delete already works on `id`; display order is derived, not stored.

### 4. Frontend implementation via bundle patch

**Choice:** Locate the history list rendering in `assets/index-D9dZHLx3.js` and apply the descending sort before mapping to list items.

**Rationale:** Consistent with other planned frontend changes (e.g. `last-ciggi-date-time`). No frontend source in repo.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Reversal applied globally by mistake, breaking charts | Only sort in the history component's render path; do not modify the shared state array |
| Bundle patch is hard to locate in minified code | Search for history route/component and `.map(` over cigarettes; smoke-test chart still renders correctly |
| ISO string comparison edge cases | `smokedAt` values are ISO 8601 strings from the API; `localeCompare` on ISO strings preserves chronological order |
| Performance with large history | Irrelevant at personal-use scale; O(n log n) sort on hundreds of entries is negligible |

## Migration Plan

No migration needed. Frontend-only change to display order. Deploy updated bundle; no server restart required.

## Open Questions

- None blocking — straightforward display-order change
