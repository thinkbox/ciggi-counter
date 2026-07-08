## 1. Explore bundle structure

- [x] 1.1 Locate the history list render in `assets/index-D9dZHLx3.js` (search for `data-testid="text-time-` and descending `smokedAt` sort)
- [x] 1.2 Confirm each row shows date (`text-date-{id}`) and time (`text-time-{id}`) before the delete button
- [x] 1.3 Locate `Iz` elapsed formatter and its hour/minute branch for reuse

## 2. Add shared elapsed helpers

- [x] 2.1 Add `fmtElapsedSince(smokedAt)` for dashboard elapsed-from-now
- [x] 2.2 Add `fmtElapsedBetween(earlier, later)` for history gap formatting (same hour/minute rules)
- [x] 2.3 Refactor `Iz` to call `fmtElapsedSince` on the latest entry's `smokedAt`

## 3. Extend history list items

- [x] 3.1 Change `.map(m => ...)` to `.map((m, S, b) => ...)` on the sorted array
- [x] 3.2 Show `fmtElapsedBetween(b[S+1].smokedAt, m.smokedAt)` when a previous entry exists; otherwise `"— "`
- [x] 3.3 Style the elapsed line with `text-sm text-primary font-tabular` (orange)
- [x] 3.4 Add `data-testid="text-elapsed-{id}"` to the elapsed line

## 4. Preserve existing behaviour

- [x] 4.1 Do not modify date/time formatting, sort order, delete controls, or empty state
- [x] 4.2 Do not change API or backend code
- [x] 4.3 Do not add live refresh interval (gaps between fixed timestamps are static)

## 5. Verify

- [x] 5.1 Logic test: two entries 2h20m apart → top row shows "2hrs 20m"
- [x] 5.2 Logic test: oldest row shows `"— "`
- [ ] 5.3 Manual test: history screen shows gap since previous cigarette for each row
- [ ] 5.4 Manual test: date, time, sort order, and delete still work unchanged
- [ ] 5.5 Manual test: empty state unchanged when no cigarettes exist
