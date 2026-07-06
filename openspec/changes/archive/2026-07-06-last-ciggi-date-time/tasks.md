## 1. Explore bundle structure

- [x] 1.1 Locate the top dashboard stats card in `assets/index-D9dZHLx3.js` (search for "Time since last ciggi" and `data-testid="text-elapsed"`)
- [x] 1.2 Identify where cigarette state is stored and how the elapsed timer derives `lastSmokedAt`
- [x] 1.3 Confirm date-fns `format` utility is available in the bundle

## 2. Add last-smoked helpers

- [x] 2.1 Add or reuse a helper that returns the latest `smokedAt` from the cigarette list
- [x] 2.2 Add a `formatLastSmokedAt(smokedAt)` helper that formats as absolute local date/time (e.g. "Mon, 5 Jul, 3:42 pm")

## 3. Extend top stats card

- [x] 3.1 Add a date/time display section inside the existing top card, placed next to the elapsed-time block
- [x] 3.2 Add label "Last ciggi at" styled consistently with the existing "Time since last ciggi" label
- [x] 3.3 Show empty-state value `"— "` when no cigarettes exist
- [x] 3.4 Ensure the existing elapsed-time display and 1-second refresh are not modified

## 4. Wire live updates

- [x] 4.1 Ensure the date/time display recomputes when a new cigarette is logged
- [x] 4.2 Ensure the date/time display recomputes when the most recent cigarette is deleted

## 5. Verify

- [x] 5.1 Manual test: empty state with no cigarettes — "Last ciggi at" shows `"— "`
- [x] 5.2 Manual test: log a cigarette and confirm date/time appears next to elapsed time in the top card
- [x] 5.3 Manual test: elapsed timer still ticks every second unchanged
- [x] 5.4 Manual test: delete the latest cigarette and confirm date/time falls back correctly
