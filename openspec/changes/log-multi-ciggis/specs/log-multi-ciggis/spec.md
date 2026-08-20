## ADDED Requirements

### Requirement: Dashboard shows Log Multi beside a narrowed Log a Ciggi button

The dashboard log row SHALL keep **Log a Ciggi** left-aligned at two-thirds width and SHALL show a **Log Multi** button on the right occupying the remaining third.

#### Scenario: User views the dashboard log controls

- **WHEN** the user opens the dashboard
- **THEN** **Log a Ciggi** remains on the left at two-thirds width
- **AND** a **Log Multi** button appears on the right
- **AND** tapping **Log a Ciggi** still logs a single ciggi at the current time

### Requirement: Log Multi opens a catch-up dialog with defaults

Tapping **Log Multi** SHALL open a dialog with From datetime, To datetime, ciggi count, an include-at-from checkbox, and an include-at-to checkbox. Defaults SHALL reset each time the dialog opens: From is the last ciggi's `smokedAt` (or local start of today if none exist); To is the current datetime; include-at-from is unchecked; include-at-to is checked; count is empty.

#### Scenario: User opens Log Multi with existing ciggis

- **WHEN** the user taps **Log Multi** and at least one cigarette exists
- **THEN** From is set to the last cigarette's timestamp
- **AND** To is set to the current datetime
- **AND** include-at-from is unchecked
- **AND** include-at-to is checked

#### Scenario: User opens Log Multi with no ciggis

- **WHEN** the user taps **Log Multi** and no cigarettes exist
- **THEN** From is set to the start of today in the local timezone
- **AND** To is set to the current datetime

### Requirement: Multi-log places ciggis evenly between From and To

The system SHALL create exactly `count` cigarette records with equal step size between From and To. A record SHALL be placed at From only when include-at-from is checked, and at To only when include-at-to is checked.

#### Scenario: Default checkboxes space from the From bound and include To

- **WHEN** From is 12:00, To is 16:00, count is 4, include-at-from is unchecked, and include-at-to is checked
- **THEN** the system creates ciggis at 13:00, 14:00, 15:00, and 16:00

#### Scenario: Both endpoints included

- **WHEN** From is 12:00, To is 16:00, count is 5, and both include checkboxes are checked
- **THEN** the system creates ciggis at 12:00, 13:00, 14:00, 15:00, and 16:00

#### Scenario: Include-at-from unchecked does not duplicate the last ciggi

- **WHEN** From equals the last existing cigarette's timestamp and include-at-from is unchecked
- **THEN** no additional record is created at that timestamp
- **AND** the remaining ciggis are still spaced using From as the interval start

### Requirement: Multi-log persists atomically and refreshes the UI

Submitting the dialog SHALL POST to `POST /api/cigarettes/multi` and insert all computed records in one transaction. On success the dialog SHALL close, the cigarette list SHALL refresh, and the user SHALL see a confirmation toast.

#### Scenario: User submits a valid multi-log

- **WHEN** the user enters a valid From, To, and count and confirms
- **THEN** every computed ciggi is stored
- **AND** the dashboard and history reflect the new records without a full page reload

#### Scenario: Invalid range or count is rejected

- **WHEN** From is not before To, count is outside 1–200, or both endpoints are included with count 1
- **THEN** no cigarettes are created
- **AND** the existing cigarette list is unchanged
