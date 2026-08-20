## Context

Ciggi Counter tracks cigarettes as `{ id, smokedAt }` records. The Express backend exposes `POST /api/cigarettes` for a single insert (dashboard log-now and History “Add Past”). The dashboard log control is a full-width `Log a Ciggi` button (`data-testid="button-log-ciggi"`) in the pre-built React bundle `assets/index-D9dZHLx3.js`; there is no frontend source in the repo.

Catching up several ciggis today requires repeated taps or one-by-one past entries. This change adds a Log Multi flow that spaces N timestamps between a From and To datetime and inserts them atomically.

## Goals / Non-Goals

**Goals:**

- Keep Log a Ciggi left-aligned at two-thirds width; add Log Multi on the right
- Dialog with From, To, count, and include-at-endpoint checkboxes, with the specified defaults
- Evenly space timestamps; place ciggis on From/To only when those checkboxes are checked
- Persist the batch in one transaction
- Refresh dashboard and history via existing cigarette-query invalidation

**Non-Goals:**

- Restoring full frontend source
- Changing single-ciggi log, Add Past, delete, or schema
- Previewing timestamps before submit
- Undo of a multi-log batch as a unit

## Decisions

### 1. Server-side spacing via `POST /api/cigarettes/multi`

**Choice:** The dialog posts `{ from, to, count, includeFrom, includeTo }`. `server/distribute.js` computes ISO timestamps; the route inserts them in one transaction.

**Rationale:** Spacing rules stay in readable Node and can be unit-tested. The minified bundle only needs form UI and one mutation. A failed request does not leave a partial batch.

**Alternative considered:** Client-side spacing plus N single POSTs — rejected (math in the bundle, partial failure). Client-side spacing plus a timestamp batch POST — rejected (still puts spacing rules in minified JS).

### 2. Equal-step spacing with optional endpoints

**Choice:** `duration = to - from`. Place `count` timestamps:

- includeFrom && includeTo → `from + i * duration / (count - 1)` for i = 0..count-1
- includeFrom && !includeTo → `from + i * duration / count`
- !includeFrom && includeTo → `from + (i + 1) * duration / count`
- !includeFrom && !includeTo → `from + (i + 1) * duration / (count + 1)`

Confirmed example: From 12:00, To 16:00, count 4, from off, to on → 13:00, 14:00, 15:00, 16:00.

**Rationale:** From/To are interval bounds; checkboxes decide whether a ciggi sits on a bound. Default (from off, to on) does not duplicate the last logged ciggi when From is that timestamp.

**Alternative considered:** Interior-only even split plus a forced To point (e.g. 12:48, 13:36, 14:24, 16:00) — rejected; user confirmed equal steps from the From boundary.

### 3. Validation

**Choice:** Reject From >= To; count not an integer in 1..200; both endpoints included with count 1.

**Rationale:** Count 1 cannot occupy two distinct times. 200 matches the daily-goal input cap. From as exclusive bound with count 1 is valid (single ciggi at To when includeTo is on).

### 4. Dashboard layout and dialog defaults

**Choice:** Flex row `gap-3`: Log a Ciggi `flex-[2]` (primary, same `h-20`), Log Multi `flex-1` outline, label `Log Multi`, test id `button-log-multi`. Dialog uses Radix Dialog already in the bundle (same pattern as Add Past). From defaults to last ciggi `smokedAt` locally, or local midnight today if none. To defaults to now. Include-from unchecked, include-to checked. Count has no default. Defaults reset whenever the dialog opens.

**Rationale:** Matches “reduce width by a third” and the catch-up case. Native checkboxes (no Checkbox component in the bundle). `datetime-local` converted to ISO on submit.

### 5. Live updates via existing query invalidation

**Choice:** On success, toast, close dialog, `invalidateQueries({ queryKey: ["/api/cigarettes"] })`.

**Rationale:** Dashboard elapsed/last-at, today counts, and history already recompute from that list.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Patching minified React is fragile | Copy the existing Add Past dialog pattern; target `button-log-ciggi` |
| Checking include-from when From equals last ciggi duplicates that timestamp | Documented; default is unchecked so catch-up does not duplicate |
| `datetime-local` timezone confusion | Convert local datetime-local values to ISO at submit; store ISO as today |
| Bundle patch breaks on a future rebuild | Keep spacing and insert logic on the server |

## Migration Plan

Deploy updated bundle and server together so the new endpoint exists when the dialog posts. Rollback: revert both; no schema migration. Existing cigarette rows are unchanged.

## Open Questions

None — spacing, defaults, and server-side insert were decided in the approved plan.
