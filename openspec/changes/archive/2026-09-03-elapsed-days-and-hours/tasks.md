## 1. Explore bundle structure

- [x] 1.1 Locate `fmtElapsedSince` and `fmtElapsedBetween` in `assets/index-D9dZHLx3.js`
- [x] 1.2 Confirm both helpers currently branch at `n>=36e5` to `{hours}hrs {minutes}m`
- [x] 1.3 Confirm `Iz` still delegates to `fmtElapsedSince` and the 1-second `setInterval` is left untouched

## 2. Implement days-and-hours formatter

- [x] 2.1 In `fmtElapsedSince`, add a ≥ 24 hour branch (`n>=864e5`) that returns `${days}d ${hours}hrs` with `days = floor(n / 86_400_000)` and `hours = floor((n % 86_400_000) / 3_600_000)`
- [x] 2.2 Keep the existing hours-and-minutes branch for `36e5 <= n < 864e5`
- [x] 2.3 Keep the existing `kz(..., { addSuffix: true })` path for durations under one hour
- [x] 2.4 Apply the same 24-hour branch to `fmtElapsedBetween`, preserving its negative-gap `"— "` and under-one-hour `jz` paths
- [x] 2.5 Keep the empty-state return `"No ciggis logged"` when the cigarette list is empty

## 3. Preserve surrounding behaviour

- [x] 3.1 Do not modify the "Time since last ciggi" label, `data-testid="text-elapsed"`, or `setInterval` refresh
- [x] 3.2 Do not modify `fmtLastCiggiAt` or the "Last ciggi at" display
- [x] 3.3 Do not change history layout, sort order, or empty-state besides elapsed formatting

## 4. Verify

- [x] 4.1 Manual test: with a last smoke ≥ 24 hours ago, confirm display shows days and hours (e.g. "1d 12hrs", "1d 0hrs")
- [x] 4.2 Manual test: with a last smoke ≥ 1 hour and < 24 hours ago, confirm display still shows hours and minutes (e.g. "3hrs 18m")
- [x] 4.3 Manual test: with a last smoke < 1 hour ago, confirm display still uses relative minutes/seconds format
- [x] 4.4 Manual test: empty state still shows "No ciggis logged"
- [x] 4.5 Manual test: "Last ciggi at" timestamp unchanged
- [x] 4.6 Manual test: history elapsed gaps of ≥ 24 hours show days and hours; shorter gaps keep existing formats
