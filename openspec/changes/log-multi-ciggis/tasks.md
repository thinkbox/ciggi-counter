## 1. Spacing helper

- [x] 1.1 Add failing Node tests for `distributeSmokedAts` (four checkbox combos, 12:00–16:00 example, invalid From/To, count bounds, both-endpoints with count 1)
- [x] 1.2 Implement `server/distribute.js` exporting `distributeSmokedAts({ from, to, count, includeFrom, includeTo })`
- [x] 1.3 Run tests and confirm they pass

## 2. Multi-log API

- [x] 2.1 Add `POST /api/cigarettes/multi` in `server/routes.js` that validates the body and uses `distributeSmokedAts`
- [x] 2.2 Insert computed records in one transaction and return `201` with the created rows
- [x] 2.3 Return an error and insert nothing when validation fails

## 3. Dashboard UI

- [x] 3.1 Wrap `button-log-ciggi` in a flex row: Log a Ciggi `flex-[2]`, Log Multi `flex-1` outline labelled `Log Multi`
- [x] 3.2 Add Log Multi dialog with From/To `datetime-local`, include checkboxes, and count input
- [x] 3.3 Reset dialog defaults on open (last ciggi or local midnight, now, from unchecked, to checked, empty count)
- [x] 3.4 POST `/api/cigarettes/multi` on submit; toast, close, and invalidate `["/api/cigarettes"]` on success

## 4. Verify

- [x] 4.1 Node tests cover the confirmed 12:00–16:00 / count 4 / from-off / to-on case
- [x] 4.2 Manual: layout 2/3 + 1/3; dialog defaults; from unchecked does not duplicate last ciggi; dashboard/history refresh
