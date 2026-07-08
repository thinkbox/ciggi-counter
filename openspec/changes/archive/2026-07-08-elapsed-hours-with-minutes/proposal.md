## Why

The "Time since last ciggi" elapsed display currently uses date-fns `formatDistance`, which rounds to whole hours (e.g. "about 3 hours ago") and hides the minutes within that hour. Showing hours and minutes together (e.g. "3hrs 18m") gives users finer at-a-glance precision without changing the live 1-second refresh.

## What Changes

- Replace the elapsed-time formatter (`Iz`) so that when the duration is at least one hour, the display shows whole hours plus remaining minutes (e.g. "3hrs 18m")
- Keep the existing "Time since last ciggi" label, `data-testid="text-elapsed"`, 1-second `setInterval` refresh, and empty state ("No ciggis logged")
- Leave shorter durations unchanged: under one hour, continue using the existing relative format (minutes and seconds as today)
- Leave the "Last ciggi at" absolute timestamp display unchanged

## Capabilities

### New Capabilities

<!-- None — this refines formatting within an existing capability -->

### Modified Capabilities

- `last-smoked-display`: Update the elapsed-time formatting requirement — hours-level display must include remaining minutes; other elapsed-time behaviour (label, refresh, empty state, placement) stays the same

## Impact

- Frontend bundle (`assets/index-D9dZHLx3.js`) — replace or extend the `Iz` elapsed-time formatter (currently wraps date-fns `formatDistance` via `kz`); source is not in repo, so implementation patches the bundle as with prior dashboard changes
- No backend API or database changes
- "Last ciggi at" date/time display unaffected
