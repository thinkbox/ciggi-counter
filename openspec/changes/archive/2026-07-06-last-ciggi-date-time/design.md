## Context

Ciggi Counter tracks cigarettes as `{ id, smokedAt }` records. The Express backend exposes `GET /api/cigarettes` ordered by `smoked_at`, and the React frontend is shipped as a pre-built bundle in `assets/` with no source in the repo.

The dashboard home screen already has a top stats card showing "Time since last ciggi" with a live elapsed-time value (`data-testid="text-elapsed"`) that refreshes every second via `setInterval`. Below that card is the daily goal section. The elapsed display answers "how long ago" but does not show the actual date and time of the last smoke.

## Goals / Non-Goals

**Goals:**

- Add absolute date and time of the last smoke to the existing top stats card, next to the elapsed-time display
- Keep the existing "Time since last ciggi" label and live elapsed timer unchanged
- Update the date/time immediately when cigarettes are added or deleted
- Derive the value client-side from existing API data (no backend changes)

**Non-Goals:**

- Replacing or removing the existing elapsed-time display
- Adding a separate new card or line elsewhere on the dashboard
- New API endpoints or database schema changes
- Showing last-smoked date/time on every screen (history, settings, etc.)
- Restoring full frontend source as part of this change (unless patching the bundle proves impractical)

## Decisions

### 1. Client-side derivation over a dedicated API endpoint

**Choice:** Compute `lastSmokedAt = max(cigarettes.map(c => c.smokedAt))` in the frontend from the existing list.

**Rationale:** The cigarette list is already fetched for the home screen. A separate endpoint adds complexity with no benefit at current scale.

**Alternative considered:** Dedicated endpoint — rejected as unnecessary for a single-user app with a small dataset.

### 2. Extend the existing top card, side by side

**Choice:** Add a second column/section inside the existing top stats card, placing the date/time display next to the elapsed-time block.

**Rationale:** The card already groups "last ciggi" context at the top of the dashboard. Adding date/time alongside elapsed time keeps related information together and avoids cluttering the layout with a new element.

**Example layout:**

```
┌──────────────────────────────────────────────┐
│  🕐   Time since last ciggi │ Last ciggi at   │
│       2h 15m 32s            │ Mon, 5 Jul,    │
│       (live, existing)      │ 3:42 pm (new)   │
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│  Daily Goal ...                              │
└──────────────────────────────────────────────┘
```

### 3. Absolute date/time formatting (date-fns)

**Choice:** Always format the new date/time field as an absolute local date and time using date-fns `format` (already bundled). Do not use relative formatting for this field — the elapsed timer already covers "how long ago".

**Rationale:** Two relative displays would be redundant. Elapsed time ticks every second; the date/time field is stable until the next cigarette is logged.

**Format:** `"EEE, d MMM, h:mm a"` → e.g. "Mon, 5 Jul, 3:42 pm" in the user's local timezone.

### 4. Label and empty state

**Choice:** Label the new field "Last ciggi at". When no cigarettes exist, show `"— "` (em dash followed by a space) as the value.

**Rationale:** Matches app voice ("ciggi" not "smoked") and keeps the layout stable — the section stays visible with a consistent placeholder rather than collapsing.

### 5. Frontend implementation approach

**Choice:** Patch the bundled JS, locating the existing top card by the "Time since last ciggi" label and `data-testid="text-elapsed"`, then add the date/time element in the same card.

**Rationale:** No frontend source exists in the repo. The target component is already identifiable in the minified bundle.

### 6. Live updates via existing state

**Choice:** Recompute `lastSmokedAt` from the same cigarette state array that drives the elapsed timer, so add/delete mutations automatically refresh the date/time display.

**Rationale:** No polling needed for date/time (unlike elapsed time). The existing optimistic update flow on POST/DELETE already mutates local state.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Side-by-side layout breaks on narrow screens | Use flex layout with wrap or stack on small viewports if needed |
| Patching minified bundle is fragile | Target the card via known strings/testids; manual smoke-test after edit |
| Timezone confusion | Format using `new Date(smokedAt)` in the browser's local timezone |
| Bundle patch breaks on next frontend rebuild | Document the change location; prefer restoring source if more frontend work is planned |

## Migration Plan

No migration needed. Frontend-only additive change to an existing card. Deploy updated bundle; no server restart required.

