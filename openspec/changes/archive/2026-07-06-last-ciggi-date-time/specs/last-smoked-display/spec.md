## ADDED Requirements

### Requirement: Display last smoked date and time in top dashboard card

The top dashboard stats card SHALL display the absolute date and time of the most recently logged cigarette under the label "Last ciggi at", placed next to the existing "Time since last ciggi" elapsed-time display within the same card.

#### Scenario: User has logged cigarettes

- **WHEN** the user opens the dashboard and at least one cigarette exists
- **THEN** the top stats card shows the date and time of the most recently logged cigarette alongside the existing elapsed-time value

#### Scenario: User has not logged any cigarettes

- **WHEN** the user opens the dashboard and no cigarettes exist
- **THEN** the "Last ciggi at" value shows `"— "` while the elapsed-time section reflects no prior smoke

### Requirement: Preserve existing elapsed-time display

The existing "Time since last ciggi" label, elapsed-time value, and 1-second refresh behaviour SHALL remain unchanged.

#### Scenario: User views dashboard with logged cigarettes

- **WHEN** the user opens the dashboard and at least one cigarette exists
- **THEN** the elapsed-time display continues to show live-updating time since last smoke
- **AND** the new date/time display appears alongside it in the same card

### Requirement: Format date and time as absolute local timestamp

The date/time display SHALL show an absolute formatted date and time in the user's local timezone, not a relative duration.

#### Scenario: Last cigarette logged at a known time

- **WHEN** the last cigarette has a `smokedAt` timestamp
- **THEN** the UI shows the local date and time (e.g. "Mon, 5 Jul, 3:42 pm")

### Requirement: Update date/time display on data changes

The date/time display SHALL update immediately when cigarette data changes, without requiring a page reload.

#### Scenario: User logs a new cigarette

- **WHEN** the user logs a new cigarette from the dashboard
- **THEN** the displayed date/time updates to reflect the new entry

#### Scenario: User deletes the most recent cigarette

- **WHEN** the user deletes the most recently logged cigarette
- **THEN** the displayed date/time updates to the previous cigarette's timestamp, or shows `"— "` if none remain

### Requirement: Derive last smoked from existing data

The last-smoked timestamp SHALL be computed client-side from the existing cigarette list returned by `GET /api/cigarettes`; no new API endpoint is required.

#### Scenario: Cigarettes loaded from API

- **WHEN** the app loads cigarette data from the API
- **THEN** the date/time display uses the entry with the latest `smokedAt` value
