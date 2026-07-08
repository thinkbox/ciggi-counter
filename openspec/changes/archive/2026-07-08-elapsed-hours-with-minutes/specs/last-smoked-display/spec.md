## MODIFIED Requirements

### Requirement: Preserve existing elapsed-time display

The "Time since last ciggi" label, `data-testid="text-elapsed"`, 1-second refresh behaviour, empty state ("No ciggis logged"), and placement alongside "Last ciggi at" SHALL remain. When the elapsed duration is one hour or more, the value SHALL show whole hours and remaining minutes in the form `{hours}hrs {minutes}m` (e.g. "3hrs 18m"). When under one hour, the value SHALL continue using the existing relative `formatDistance` output.

#### Scenario: User views dashboard with logged cigarettes

- **WHEN** the user opens the dashboard and at least one cigarette exists
- **THEN** the elapsed-time display continues to show live-updating time since last smoke
- **AND** the "Last ciggi at" date/time display appears alongside it in the same card

#### Scenario: Elapsed duration is one hour or more

- **WHEN** at least one hour has passed since the most recent cigarette
- **THEN** the elapsed-time value shows whole hours and remaining minutes (e.g. "3hrs 18m")
- **AND** the minutes component updates as time passes

#### Scenario: Elapsed duration is under one hour

- **WHEN** less than one hour has passed since the most recent cigarette
- **THEN** the elapsed-time value uses the existing relative format (e.g. minutes or seconds via `formatDistance`)

#### Scenario: No cigarettes logged

- **WHEN** the user opens the dashboard and no cigarettes exist
- **THEN** the elapsed-time value shows "No ciggis logged"
