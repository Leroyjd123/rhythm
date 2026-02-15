# Rhythm – Development Roadmap (Milestone Format)

Version: 1.0

---

# Milestone 0 – Project Foundation

## Objective

Establish clean project structure and technical baseline before feature development.

## Scope

- Repository setup
- Folder structure
- Manifest V3 setup
- Theme system
- Storage abstraction
- Logger scaffold

## Deliverables

- Extension loads successfully
- Popup renders base layout
- Service worker runs without errors
- Theme switching functional
- Storage read/write abstraction working
- Logger module operational
- Schema version scaffold present

## Acceptance Criteria

- Extension loads in Chrome without console errors
- `manifest.json` contains only required permissions
- Theme toggles correctly between light and dark
- Storage layer can persist and retrieve test data
- Logs are written via logger module only
- No hardcoded styles (tokens used)

---

# Milestone 1 – Unified Reminder Engine

## Objective

Implement stable, reusable reminder engine before UI integration.

## Scope

- Reminder object model
- Interval scheduling
- Fixed-time scheduling
- Alarm recreation on startup
- Snooze logic (5 min)
- Grouped notification dispatcher
- Auto-dismiss (5 min)
- Focus suppression gate
- Rehydration after extension re-enable

## Deliverables

- Engine can create, trigger, and cancel reminders
- Snooze works
- Multiple simultaneous reminders group into single notification

## Acceptance Criteria

- Interval reminder fires correctly
- Fixed-time reminder fires correctly
- Changing interval resets timer immediately
- Snooze creates temporary alarm and fires once
- Disabling reminder cancels alarm immediately
- Multiple simultaneous triggers produce one notification with bullet list
- Extension restart recreates all alarms
- No duplicate alarms created
- All events logged

---

# Milestone 2 – Water Reminder (Vertical Slice)

## Objective

Deliver first complete user-facing feature.

## Scope

- Water UI card
- Enable/disable toggle
- Interval configuration
- Daily target
- Counter tracking
- Midnight reset
- Subtle confetti animation
- Per-reminder sound toggle

## Deliverables

- Fully functional water reminder

## Acceptance Criteria

- Default interval: 15 minutes
- Default target: 8 glasses
- Log increments by +1
- Counter visible on dashboard
- Target completion triggers subtle confetti animation
- Exceeding target allowed
- Midnight reset works
- Restart preserves state
- Focus mode suppresses water reminders
- Sound toggle per reminder works

---

# Milestone 3 – Movement Reminders

## Objective

Implement posture, break, eye rest, stand, stretch, breathing.

## Scope

- Generic reminder card reuse
- Daily counters
- Done button logic
- Notification grouping support

## Deliverables

- All interval-based reminders functional

## Acceptance Criteria

- All reminders track daily count
- Done increments counter
- Ignored reminders do not retry
- Grouped notifications include movement reminders
- Minimum interval enforced (5 minutes)
- Interval validation auto-corrects invalid input

---

# Milestone 4 – Work Schedule System

## Objective

Implement fixed-time schedule discipline layer.

## Scope

- Work start
- Lunch
- Work end
- Custom workday selector
- Weekend skip default ON
- Timezone auto-detect
- Timezone override
- Immediate recalculation on change

## Deliverables

- Reliable fixed-time reminders

## Acceptance Criteria

- Work reminders fire only on selected days
- If enabled after time passed → scheduled for next valid day
- Changing timezone recalculates alarms immediately
- Changing workdays applies immediately
- Restart preserves correct scheduling
- No duplicate firing

---

# Milestone 5 – Focus Mode

## Objective

Implement global suppression system.

## Scope

- 1-hour default
- Manual stop
- 1-minute resume buffer
- Live countdown display
- Dismiss active notifications
- Completion notification

## Deliverables

- Fully operational Focus Mode

## Acceptance Criteria

- All reminders suppressed during focus
- No reminders queued
- Countdown updates live
- Manual stop resumes reminders after 1-minute buffer
- Focus persists after restart
- Focus completion notification fires with sound
- Active notifications dismissed when focus starts

---

# Milestone 6 – Notes System

## Objective

Deliver lightweight note functionality.

## Scope

- Auto-save on typing
- Multi-line support
- 10,000 character limit
- Reordering
- Completion state
- Move completed to bottom
- 50-note limit warning
- Empty note auto-delete

## Deliverables

- Fully functional notes section

## Acceptance Criteria

- Notes persist across restart
- Completed notes move to bottom immediately
- Character limit enforced
- Empty notes auto-delete
- Exceeding 50 notes shows warning but allows creation
- No performance lag with 50 notes

---

# Milestone 7 – Advanced Settings & Debug

## Objective

Stability and maintainability layer.

## Scope

- Collapsible advanced settings
- Debug log viewer
- Raw JSON export
- Reset data (with confirmation)
- Per-reminder sound UI
- Master disable toggle
- Corruption auto-reset

## Deliverables

- Production-ready configuration layer

## Acceptance Criteria

- Debug logs visible in hidden panel
- Export downloads valid raw JSON
- Reset requires confirmation
- Corrupted storage auto-resets safely
- Master toggle disables all reminders immediately
- Logs persist across restart

---

# Milestone 8 – Hardening & Edge Case Testing

## Objective

Ensure production stability.

## Scope

- Restart testing
- Disable/re-enable extension test
- Timezone change test
- System time change test
- Simultaneous triggers
- Reminder limit enforcement
- Accessibility audit
- Performance test (<300ms load)

## Deliverables

- Release candidate

## Acceptance Criteria

- No console errors
- No alarm duplication
- Popup loads under 300ms
- Keyboard navigation functional
- Contrast passes WCAG AA
- No unexpected notification behavior
- All reminder limits enforced correctly

---

# Milestone 9 – Store Preparation

## Objective

Prepare for public release.

## Scope

- Icons (16, 32, 48, 128)
- Screenshots
- Store description
- Privacy declaration
- Packaging and upload

## Acceptance Criteria

- Extension uploads without warnings
- Privacy policy accurate
- No unnecessary permissions flagged
- Store assets consistent with product identity

---

# Release Criteria

Rhythm v1 is ready when:

- All acceptance criteria met
- No open critical bugs
- No duplicated alarms
- No missed midnight resets
- Focus mode stable
- All reminders persist across restart
- No feature scope expansion beyond defined PRD
