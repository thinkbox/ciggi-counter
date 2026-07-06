## 1. Locate history rendering

- [x] 1.1 Find the history screen component in `assets/index-D9dZHLx3.js` (search for history route, dialog, or list rendering over cigarettes)
- [x] 1.2 Confirm the list currently maps directly over the shared cigarettes array in API order
- [x] 1.3 Identify chart/stats consumers of the same array to ensure they are not affected

## 2. Apply descending sort for history

- [x] 2.1 Add a derived display array sorted by `smokedAt` descending before the history list `.map()` call
- [x] 2.2 Ensure the sort creates a copy and does not mutate the shared cigarettes state
- [x] 2.3 Wire the history list to render from the sorted display array

## 3. Verify live updates

- [x] 3.1 Confirm a newly logged cigarette appears at the top of the history list
- [x] 3.2 Confirm deleting an entry removes it and remaining entries stay in descending order

## 4. Regression check

- [x] 4.1 Manual test: history with multiple entries — newest at top, oldest at bottom
- [x] 4.2 Manual test: history empty state still works
- [x] 4.3 Manual test: chart/stats on home screen still render correctly (API order unchanged)
