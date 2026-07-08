## Why

The history screen shows each cigarette's date and absolute time, but not how long it had been since the previous smoke. Adding an elapsed line below each entry's time gives users immediate context about the gap between consecutive cigarettes without leaving the history view.

## What Changes

- Add an elapsed-time line directly below each history entry's existing time (`h:mm a`), in orange text
- Compute elapsed time as the gap between consecutive smokes: for each entry, the duration from the previous (older) cigarette to that entry — not from that entry to now
- Show `"— "` for the oldest entry (no prior cigarette to compare against)
- Reuse the same elapsed formatting rules as the dashboard (`{hours}hrs {minutes}m` when ≥ 1 hour; `formatDistance` below that)
- Leave existing date/time display, sort order, delete controls, and empty state unchanged

## Capabilities

### New Capabilities

- `history-elapsed-display`: Show per-entry elapsed gap since the previous cigarette in orange below each history item's time, with consistent formatting with the dashboard

### Modified Capabilities

<!-- None — history sort order and other history behaviour unchanged -->

## Impact

- Frontend bundle (`assets/index-D9dZHLx3.js`) — extend the history list item render (currently date + time per entry with `data-testid="text-time-{id}"`); patch approach consistent with prior frontend changes
- No backend API or database changes
- `history-display-order` behaviour unaffected
