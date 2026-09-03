## Why

The "Time since last ciggi" elapsed display currently shows `{hours}hrs {minutes}m` for every duration of one hour or more, so a day-plus streak reads as a large hour count (e.g. "36hrs 12m"). Switching to days and hours at the 24-hour mark makes longer streaks easier to read at a glance.

## What Changes

- When elapsed time is 24 hours or more, show whole days plus remaining hours (e.g. "1d 12hrs") instead of a growing hour count
- Keep the existing hours-and-minutes format for durations of one hour up to (but not including) 24 hours
- Keep under-one-hour relative `formatDistance` output, the "Time since last ciggi" label, `data-testid="text-elapsed"`, 1-second refresh, and empty state ("No ciggis logged")
- Apply the same formatting rules to history elapsed-gap lines, which already share the dashboard formatter
- Leave the "Last ciggi at" absolute timestamp display unchanged

## Capabilities

### New Capabilities

<!-- None — this refines formatting within existing capabilities -->

### Modified Capabilities

- `last-smoked-display`: Update the elapsed-time formatting requirement — durations of 24 hours or more must show days and remaining hours; 1 hour up to 24 hours stay hours-and-minutes; other elapsed-time behaviour (label, refresh, empty state, placement) stays the same
- `history-elapsed-display`: Keep history elapsed-gap formatting consistent with the dashboard, including the new 24-hour days-and-hours band

## Impact

- Frontend bundle (`assets/index-D9dZHLx3.js`) — extend `fmtElapsedSince` and `fmtElapsedBetween` with a ≥ 24 hour branch; source is not in repo, so implementation patches the bundle as with prior dashboard changes
- No backend API or database changes
- "Last ciggi at" date/time display unaffected
