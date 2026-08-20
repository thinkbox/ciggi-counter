## Why

Catching up after a stretch of unlogged ciggis currently means tapping Log a Ciggi repeatedly or adding each one by hand on History. Users need a way to record several ciggis across a time range in one step, evenly spaced, without duplicating the last already-logged ciggi.

## What Changes

- Shrink the dashboard **Log a Ciggi** button to two-thirds width (left-aligned) and add a **Log Multi** button on the right
- Open a dialog from **Log Multi** with From datetime, To datetime, ciggi count, and include-at-endpoint checkboxes
- Default From to the last logged ciggi (or start of today if none), To to now; From include checkbox off, To include checkbox on
- Evenly space the requested ciggis between From and To, placing records on the endpoints only when their checkboxes are checked
- Persist the batch atomically via a new `POST /api/cigarettes/multi` endpoint

## Capabilities

### New Capabilities

- `log-multi-ciggis`: Dashboard Log Multi control, catch-up dialog, even timestamp spacing, and atomic multi-insert API

### Modified Capabilities

<!-- No existing capability requirements change; last-smoked and history continue to derive from the cigarette list -->

## Impact

- Frontend bundle (`assets/index-D9dZHLx3.js`) — wrap the existing `button-log-ciggi` control and add a Log Multi dialog (no frontend source in repo)
- Backend: new `POST /api/cigarettes/multi` and a `distributeSmokedAts` helper; existing `POST /api/cigarettes` unchanged
- No database schema changes
- Cigarette list, dashboard stats, and history refresh via the existing `["/api/cigarettes"]` query invalidation
