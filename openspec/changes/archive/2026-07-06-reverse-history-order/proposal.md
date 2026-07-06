## Why

The cigarette history list currently shows entries oldest-first, matching the API's ascending `smoked_at` order. Users checking recent smokes must scroll to the bottom to find their latest entries. Reversing the history display to newest-first matches how people scan recent activity.

## What Changes

- Display the history list in reverse chronological order (most recent cigarette at the top)
- Preserve ascending order from the API for other consumers (charts, aggregations) that expect chronological data
- Ensure newly logged cigarettes appear at the top of the history list immediately

## Capabilities

### New Capabilities

- `history-display-order`: History screen rendering order for the cigarette list — newest entries first

### Modified Capabilities

<!-- No existing main specs yet -->

## Impact

- Frontend bundle (`assets/index-D9dZHLx3.js`) — reverse or re-sort cigarettes when rendering the history view
- No backend API or database changes required
- No impact on `GET /api/cigarettes` response order (stays ascending for chart compatibility)
