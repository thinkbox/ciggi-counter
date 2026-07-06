## Why

The dashboard already shows elapsed time since the last cigarette in a top stats card, but not the actual date and time it was smoked. Adding the timestamp alongside the existing elapsed display gives users both "how long ago" and "when exactly" at a glance.

## What Changes

- Add the date and time of the most recently logged cigarette to the existing top dashboard card, displayed next to the current "Time since last ciggi" elapsed value
- Label the new field "Last ciggi at"; show `"— "` when no cigarettes have been logged yet
- Update the displayed date/time immediately when the user logs or deletes a cigarette
- Format the timestamp as an absolute local date and time (e.g. "Mon, 5 Jul, 3:42 pm")

## Capabilities

### New Capabilities

- `last-smoked-display`: Extend the top dashboard stats card to show the latest cigarette's smoked-at date and time alongside the existing elapsed-time display, with live updates and empty-state handling

### Modified Capabilities

<!-- No existing main specs yet -->

## Impact

- Frontend bundle (`assets/index-D9dZHLx3.js`) — extend the existing top stats card (currently labelled "Time since last ciggi" with `data-testid="text-elapsed"`); source is not in repo, so implementation may patch the bundle or require restoring frontend source
- No backend API changes required — latest cigarette can be derived client-side from `GET /api/cigarettes`
- No database schema changes
- Existing elapsed-time display and its 1-second refresh interval remain unchanged
