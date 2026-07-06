## ADDED Requirements

### Requirement: History list shows newest entries first

The history screen SHALL display cigarettes in reverse chronological order, with the most recently smoked cigarette at the top of the list.

#### Scenario: User opens history with multiple entries

- **WHEN** the user opens the history screen and multiple cigarettes exist
- **THEN** the entry with the latest `smokedAt` timestamp appears at the top of the list
- **AND** the entry with the earliest `smokedAt` timestamp appears at the bottom

#### Scenario: User opens history with a single entry

- **WHEN** the user opens the history screen and exactly one cigarette exists
- **THEN** that single entry is displayed at the top of the list

#### Scenario: User opens history with no entries

- **WHEN** the user opens the history screen and no cigarettes exist
- **THEN** the empty state is shown (order is not applicable)

### Requirement: New entries appear at top of history

When a cigarette is logged while the history screen is visible or revisited, the new entry SHALL appear at the top of the history list.

#### Scenario: User logs a cigarette then views history

- **WHEN** the user logs a new cigarette and opens the history screen
- **THEN** the newly logged cigarette appears as the first item in the list

#### Scenario: User logs a cigarette while history is open

- **WHEN** the user logs a new cigarette while the history screen is already open
- **THEN** the newly logged cigarette appears at the top of the list without requiring a page reload

### Requirement: API order unchanged for non-history consumers

Reversing history display order SHALL NOT change the order returned by `GET /api/cigarettes`; the reversal MUST be applied only when rendering the history view.

#### Scenario: Chart or stats use API data

- **WHEN** charts or daily-count aggregations consume the cigarette list from the API
- **THEN** they continue to receive entries in ascending chronological order (`smoked_at` oldest first)
