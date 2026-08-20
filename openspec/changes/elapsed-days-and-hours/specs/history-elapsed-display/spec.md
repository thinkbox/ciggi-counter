## MODIFIED Requirements

### Requirement: Format elapsed time consistently with dashboard

Elapsed-time values on the history screen SHALL use the same formatting rules as the dashboard "Time since last ciggi" display: `{days}d {hours}hrs` when the duration is 24 hours or more, `{hours}hrs {minutes}m` when the duration is one hour or more but less than 24 hours, and date-fns `formatDistance` with suffix for durations under one hour.

#### Scenario: Gap between entries is 24 hours or more

- **WHEN** the time between the previous cigarette and the current entry is at least 24 hours
- **THEN** the elapsed line shows whole days and remaining hours (e.g. "1d 12hrs")

#### Scenario: Gap between entries is one hour or more but less than 24 hours

- **WHEN** the time between the previous cigarette and the current entry is at least one hour and less than 24 hours
- **THEN** the elapsed line shows whole hours and remaining minutes (e.g. "2hrs 20m")

#### Scenario: Gap between entries is less than one hour

- **WHEN** the time between the previous cigarette and the current entry is less than one hour
- **THEN** the elapsed line uses the existing relative format (e.g. "45 minutes ago")
