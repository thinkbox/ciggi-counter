## 1. Explore bundle structure

- [x] 1.1 Locate `function Iz` in `assets/index-D9dZHLx3.js` (elapsed-time formatter used by `data-testid="text-elapsed"`)
- [x] 1.2 Confirm `Iz` delegates to date-fns `formatDistance` (`kz`) with `{ addSuffix: true }` for the relative display
- [x] 1.3 Confirm the 1-second `setInterval` in `e8` calls `Iz(l)` and is left untouched

## 2. Implement hours-with-minutes formatter

- [x] 2.1 Replace the `Iz` body so that when elapsed ≥ 1 hour, it computes `hours = floor(elapsedMs / 3_600_000)` and `minutes = floor((elapsedMs % 3_600_000) / 60_000)`
- [x] 2.2 Return `${hours}hrs ${minutes}m` for the hour-range branch
- [x] 2.3 Keep the existing `kz(..., { addSuffix: true })` path for durations under one hour
- [x] 2.4 Keep the empty-state return `"No ciggis logged"` when the cigarette list is empty

## 3. Preserve surrounding behaviour

- [x] 3.1 Do not modify the "Time since last ciggi" label, `data-testid="text-elapsed"`, or `setInterval` refresh
- [x] 3.2 Do not modify `fmtLastCiggiAt` or the "Last ciggi at" display

## 4. Verify

- [x] 4.1 Manual test: with a last smoke ≥ 1 hour ago, confirm display shows hours and minutes (e.g. "3hrs 18m")
- [x] 4.2 Manual test: with a last smoke < 1 hour ago, confirm display still uses relative minutes/seconds format
- [x] 4.3 Manual test: confirm elapsed value still refreshes every second and minutes tick over time
- [x] 4.4 Manual test: empty state still shows "No ciggis logged"
- [x] 4.5 Manual test: "Last ciggi at" timestamp unchanged
