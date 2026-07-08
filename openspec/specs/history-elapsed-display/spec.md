# history-elapsed-display Specification

## Purpose
TBD - created by syncing change history-elapsed-since. Update Purpose after archive.
## Requirements
### Requirement: Display elapsed gap below each history entry time

Each history list item SHALL show an elapsed-time value directly below the existing time (`h:mm a`), computed as the duration from the previous (older) cigarette to that entry's `smokedAt` timestamp.

#### Scenario: User views history with multiple entries

- **WHEN** the user opens the history screen and multiple cigarettes exist
- **THEN** each entry except the oldest shows an elapsed-time line below its time value
- **AND** the elapsed value reflects how long it had been since the previous cigarette was smoked

#### Scenario: User views history with a single entry

- **WHEN** the user opens the history screen and exactly one cigarette exists
- **THEN** that entry shows `"— "` as the elapsed line (no prior cigarette exists)

#### Scenario: Oldest entry in a multi-entry history

- **WHEN** the user views the oldest (bottom) entry in the history list
- **THEN** the elapsed line shows `"— "` because there is no earlier cigarette to compare against

### Requirement: Style elapsed time in orange

The elapsed-time line SHALL be displayed in orange text, positioned immediately below the entry's existing time.

#### Scenario: User views a history entry

- **WHEN** an elapsed-time line is rendered for a history entry
- **THEN** it appears directly under the time (`h:mm a`) in orange (`text-primary` in the app theme)

### Requirement: Format elapsed time consistently with dashboard

Elapsed-time values on the history screen SHALL use the same formatting rules as the dashboard "Time since last ciggi" display: `{hours}hrs {minutes}m` when the duration is one hour or more, and date-fns `formatDistance` with suffix for durations under one hour.

#### Scenario: Gap between entries is one hour or more

- **WHEN** the time between the previous cigarette and the current entry is at least one hour
- **THEN** the elapsed line shows whole hours and remaining minutes (e.g. "2hrs 20m")

#### Scenario: Gap between entries is less than one hour

- **WHEN** the time between the previous cigarette and the current entry is less than one hour
- **THEN** the elapsed line uses the existing relative format (e.g. "45 minutes ago")

### Requirement: Preserve existing history entry layout

The existing date, time, sort order (newest first), delete controls, and empty state on the history screen SHALL remain unchanged.

#### Scenario: User views history

- **WHEN** the user opens the history screen
- **THEN** each entry still shows its date and time as before
- **AND** entries remain sorted with the newest at the top
