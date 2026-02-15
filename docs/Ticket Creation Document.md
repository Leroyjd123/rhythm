# Rhythm – Detailed Ticket Breakdown (Atomic Level)

Version: 1.0

---

## Milestone 1: Unified Reminder Engine Core

Goal:  
Build a stable, reusable reminder engine using chrome.alarms before integrating UI complexity.

No UI styling required in this milestone.  
Focus only on background logic, scheduling, and notification handling.

---

# TICKET 1.1 – Create Reminder Engine Skeleton

## Title

Create reminder-engine module structure

## Description

Create `reminder-engine.js` with exported function placeholders:

- initializeEngine()
- createReminder(reminder)
- deleteReminder(id)
- recreateAllReminders()
- handleAlarm(alarm)
- scheduleIntervalReminder(reminder)
- scheduleFixedReminder(reminder)
- cancelReminder(id)

No logic yet — only structure and imports wired.

## Acceptance Criteria

- File created and imported into service worker.
- No console errors.
- initializeEngine() runs on startup.
- Logger logs engine initialization.

## Test Cases

- Manual: reload extension → no errors.
- Console shows initialization log.

---

# TICKET 1.2 – Implement Alarm Existence Guard

## Title

Prevent duplicate alarm creation

## Description

Before creating an alarm, check if an alarm with the same ID already exists.
If exists, cancel before recreating.

## Acceptance Criteria

- Creating same reminder twice does not create duplicate alarms.
- chrome.alarms.getAll() shows only one alarm per reminder.
- Log entry created when duplicate prevented.

## Test Cases

- Enable reminder twice.
- Restart extension.
- Verify no duplicate alarms in DevTools.

---

# TICKET 1.3 – Implement Interval Scheduler

## Title

Build scheduleIntervalReminder() using chrome.alarms

## Description

Implement scheduling for interval-based reminders.

Rules:

- Minimum 5 minutes enforced.
- Use periodInMinutes.
- Store lastTriggered timestamp.

## Acceptance Criteria

- Interval reminder fires correctly.
- Invalid interval auto-corrects to 5.
- Changing interval cancels old alarm and creates new one.
- Logs show alarm creation.

## Test Cases

- TC-03 Enable Interval Reminder
- TC-04 Minimum Interval Enforcement
- TC-06 Change Interval While Active

---

# TICKET 1.4 – Implement Fixed-Time Scheduler

## Title

Build scheduleFixedReminder() logic

## Description

Convert HH:mm to next valid timestamp.

Rules:

- If time already passed → schedule next valid day.
- Respect workdays array.
- Respect timezone override (if set).

## Acceptance Criteria

- Reminder fires at correct local time.
- Past-time scheduling defers correctly.
- No duplicate alarms.
- Logs reflect next scheduled timestamp.

## Test Cases

- TC-14 Work Start Reminder
- TC-15 Enable After Time Passed

---

# TICKET 1.5 – Attach Alarm Listener

## Title

Implement chrome.alarms.onAlarm routing

## Description

Attach listener in service worker.
Route alarm to reminder-engine.handleAlarm().

Handle:

- Unknown alarm IDs safely.
- Log each trigger event.

## Acceptance Criteria

- Alarm fires → handleAlarm called.
- No crash on unknown ID.
- Trigger logged.

## Test Cases

- Enable reminder and wait.
- Inspect console logs.
- Simulate unknown alarm manually.

---

# TICKET 1.6 – Implement Reminder Enable Logic

## Title

Enable reminder and schedule alarm

## Description

When reminder.enabled = true:

- Save to storage.
- Schedule correct alarm.
- Log action.

## Acceptance Criteria

- Enabling creates alarm.
- Storage updated.
- Log created.
- No duplicate scheduling.

## Test Cases

- Enable water reminder.
- Verify alarm exists.
- Restart and verify still exists.

---

# TICKET 1.7 – Implement Reminder Disable Logic

## Title

Disable reminder and cancel alarm

## Description

When reminder.enabled = false:

- Cancel alarm.
- Cancel snooze if exists.
- Update storage.
- Log action.

## Acceptance Criteria

- Alarm removed.
- Snooze alarm removed.
- No notification fires after disable.

## Test Cases

- Enable reminder.
- Disable before firing.
- Verify no notification.

---

# TICKET 1.8 – Implement Snooze Logic

## Title

Add fixed 5-minute snooze implementation

## Description

When Snooze clicked:

- Create one-time alarm (delayInMinutes = 5).
- Do not modify recurring alarm.

## Acceptance Criteria

- Snooze triggers once.
- Recurring schedule unaffected.
- Disabling reminder cancels snooze.
- Log entries created.

## Test Cases

- TC-07 Snooze Behavior
- TC-08 Disable During Snooze

---

# TICKET 1.9 – Implement Notification Dispatch

## Title

Create notification creation logic

## Description

Use chrome.notifications.create.

Rules:

- Auto-dismiss after 5 minutes.
- Respect soundEnabled metadata.
- Clicking body does nothing.

## Acceptance Criteria

- Notification appears.
- Auto-dismiss works.
- Sound respects toggle.
- Logs created.

## Test Cases

- Trigger reminder.
- Verify auto-dismiss.
- Toggle sound and test.

---

# TICKET 1.10 – Implement Grouped Notification Buffer

## Title

Group simultaneous reminders into one notification

## Description

Add short buffering mechanism (e.g., 500ms–1000ms).
If multiple alarms fire in same window:

- Combine into single notification.
- Display bullet list.

## Acceptance Criteria

- Single notification shown for simultaneous triggers.
- Bullet list formatting correct.
- No stacked notifications.

## Test Cases

- TC-09 Simultaneous Triggers

---

# TICKET 1.11 – Implement Engine Rehydration on Startup

## Title

Recreate alarms on startup and install

## Description

Attach:

- chrome.runtime.onInstalled
- chrome.runtime.onStartup

Call recreateAllReminders().

## Acceptance Criteria

- Restart Chrome → alarms restored.
- Disable & re-enable → alarms restored.
- No duplication.
- Logs show recreation event.

## Test Cases

- TC-26 Restart Browser
- TC-27 Disable & Re-enable Extension

---

# TICKET 1.12 – Implement Midnight Reset Alarm (Core Engine Level)

## Title

Add daily midnight reset scheduling

## Description

Create dedicated alarm:

- Name: "midnightReset"
- Schedule next midnight
- On trigger:
  - Reset daily stats
  - Reschedule next midnight

## Acceptance Criteria

- Reset runs exactly once per day.
- Restart after midnight triggers reset.
- No duplicate resets.
- Logs show reset event.

## Test Cases

- TC-13 Midnight Reset
- Restart after date change

---

# Milestone 1 Definition of Done

Milestone 1 is complete only if:

- All tickets merged separately.
- All acceptance criteria met.
- All related test cases pass.
- No console errors.
- No duplicate alarms.
- Restart tested.
- Disable/re-enable tested.
- Grouped notifications verified.
- Midnight reset verified.

Only after this milestone is stable should UI-heavy work begin.

## Milestone 2: Water Reminder (Full Vertical Slice)

Goal:
Deliver a fully functional Water Reminder feature using the unified reminder engine.

This milestone connects:

- UI
- Storage
- Reminder engine
- Midnight reset
- Notifications
- Completion animation

Each ticket must be merged independently.

---

# TICKET 2.1 – Add Water Reminder to Schema

## Title

Add default water reminder object to storage schema

## Description

Extend schema initialization to include water reminder object with:

- id: "water"
- type: "interval"
- intervalMinutes: 15
- enabled: false
- metadata:
  - dailyTarget: 8
  - unit: "glasses"
  - soundEnabled: true

Also initialize stats.water.

## Acceptance Criteria

- Water object exists after schema initialization.
- Default interval = 15.
- Default target = 8.
- Stats object initialized.
- No schema corruption.

## Test Cases

- Fresh install → inspect storage.
- Manual reset → schema recreated properly.

---

# TICKET 2.2 – Build Water Reminder Card UI (Collapsed State)

## Title

Create collapsed water reminder card component

## Description

Add water reminder card to popup dashboard.

Collapsed state must show:

- Icon
- Label ("Water")
- Current count (e.g., 0 / 8)
- Toggle switch

No expanded settings yet.

## Acceptance Criteria

- Card renders correctly.
- Counter displays 0 / 8.
- Toggle visible.
- No console errors.

## Test Cases

- Open popup → water card visible.
- Reload extension → UI still renders.

---

# TICKET 2.3 – Implement Water Toggle Behavior

## Title

Connect water toggle to engine enable/disable logic

## Description

When toggle ON:

- Set enabled = true.
- Call engine createReminder().

When toggle OFF:

- Cancel alarm.
- Update storage.

## Acceptance Criteria

- Toggle ON creates alarm.
- Toggle OFF cancels alarm.
- Restart preserves toggle state.
- No duplicate alarms.

## Test Cases

- TC-03 Enable Interval Reminder
- TC-05 Disable Reminder
- Restart Chrome → verify behavior.

---

# TICKET 2.4 – Add Expandable Settings Panel

## Title

Implement expandable panel for water settings

## Description

On clicking water card:
Expand panel containing:

- Interval input (number)
- Unit selector (minutes only for V1)
- Target input
- Unit label selector (glasses/sips/litres)
- Sound toggle

Collapsed by default.

## Acceptance Criteria

- Expand/collapse works.
- No layout shift issues.
- Values loaded from storage.
- Values update on change.

## Test Cases

- Expand and collapse multiple times.
- Reload → values persist.

---

# TICKET 2.5 – Implement Interval Input Validation

## Title

Add minimum interval validation (5 min enforcement)

## Description

If user inputs value < 5:

- Auto-correct to 5.
- Update storage.
- Reschedule alarm if enabled.

## Acceptance Criteria

- Values below 5 corrected.
- Alarm rescheduled immediately.
- No crash on invalid input.

## Test Cases

- Enter 1 → auto-correct to 5.
- Verify alarm schedule updated.

---

# TICKET 2.6 – Implement Water Log Button (Notification Action)

## Title

Handle "Log" button increment logic

## Description

When notification button clicked:

- Increment stats.water.todayCount by +1.
- Update storage.
- Update UI counter.
- Log event.

## Acceptance Criteria

- Counter increments exactly by 1.
- No duplicate increment.
- Exceeding target allowed.
- Restart preserves count.

## Test Cases

- TC-17 Log Increment
- Reload popup → counter persists.

---

# TICKET 2.7 – Implement Water Daily Target Check

## Title

Add completion detection logic

## Description

After increment:

- If todayCount >= dailyTarget → mark as completed.
- Trigger completion animation event.

Do not block further increments.

## Acceptance Criteria

- Completion detected properly.
- Target comparison correct.
- No false positives.

## Test Cases

- Log until target.
- Verify detection.
- Log beyond target → still allowed.

---

# TICKET 2.8 – Implement Confetti Micro Animation

## Title

Add lightweight confetti animation on target completion

## Description

When completion detected:

- Trigger subtle animation in popup.
- Must be:
  - Lightweight
  - Short duration
  - Non-blocking

Animation may trigger multiple times per day.

## Acceptance Criteria

- Animation visible.
- Does not freeze UI.
- Can trigger repeatedly.
- No memory leaks.

## Test Cases

- Reach target multiple times.
- Verify animation each time.
- Open/close popup → no errors.

---

# TICKET 2.9 – Implement Midnight Reset for Water Stats

## Title

Reset water counter at midnight

## Description

On midnight reset:

- Set todayCount = 0.
- Update lastResetDate.
- Do not reset reminder configuration.

## Acceptance Criteria

- Counter resets once per day.
- Restart after midnight triggers reset.
- No double reset.
- Logs show reset event.

## Test Cases

- TC-13 Midnight Reset
- Simulate date change → reload extension.

---

# TICKET 2.10 – Implement Water Sound Toggle

## Title

Connect per-reminder sound toggle to notification system

## Description

If soundEnabled = false:

- Suppress notification sound.
  If true:
- Use default Chrome sound.

## Acceptance Criteria

- Sound plays when enabled.
- Silent when disabled.
- Restart preserves preference.

## Test Cases

- Toggle sound ON/OFF.
- Trigger reminder.
- Verify sound behavior.

---

# TICKET 2.11 – Validate Water Behavior Under Focus Mode

## Title

Ensure water reminders suppressed during Focus Mode

## Description

When Focus Mode active:

- Water reminders must not fire.
- Logging should reflect suppression.

## Acceptance Criteria

- No notification appears during focus.
- Counter unchanged.
- Log entry created.

## Test Cases

- Activate focus.
- Wait for scheduled trigger.
- Confirm suppression.

---

# Milestone 2 Definition of Done

Milestone 2 is complete only if:

- All tickets merged independently.
- All related test cases pass.
- Water reminder works end-to-end.
- Restart tested.
- Disable/re-enable tested.
- Midnight reset verified.
- No duplicate alarms.
- No console errors.
- Completion animation stable.

Only after Milestone 2 is stable should additional reminders be implemented.

---

## Milestone 3: Movement Reminders (Posture, Break, Eye, Stand, Stretch, Breathing)

Goal:
Add all interval-based movement reminders using the existing unified reminder engine.

No new scheduling logic allowed.
Only reuse interval scheduler from Milestone 1.

Each reminder must:

- Be independently toggleable
- Track daily count
- Support snooze
- Support grouped notifications
- Respect Focus Mode
- Persist across restart

All tickets are atomic and mergeable.

---

# TICKET 3.1 – Add Movement Reminder Schema Entries

## Title

Extend schema to include movement reminder objects

## Description

Add the following reminder objects to schema:

- posture
- break
- eye
- stand
- stretch
- breathing

Each must include:

- id
- enabled: false
- type: "interval"
- intervalMinutes (default 30)
- metadata:
  - soundEnabled: true

Initialize stats entries for each.

## Acceptance Criteria

- All six reminders exist in storage.
- Default interval = 30 minutes.
- All disabled by default.
- No schema corruption.

## Test Cases

- Fresh install → inspect storage.
- Reset data → verify structure recreated.

---

# TICKET 3.2 – Create Generic Reminder Card Component

## Title

Create reusable interval reminder card component

## Description

Refactor water UI into reusable component for interval-based reminders.

Component must support:

- Icon
- Label
- Toggle
- Interval input
- Daily counter display
- Sound toggle

Water must continue working using this component.

## Acceptance Criteria

- Water uses new generic component.
- UI consistent across reminders.
- No regression in water behavior.

## Test Cases

- Verify water functionality unchanged.
- Expand/collapse works.

---

# TICKET 3.3 – Implement Posture Reminder

## Title

Add posture reminder using generic component

## Description

Integrate posture reminder using engine.

Default interval: 30 minutes.

Must:

- Schedule interval alarm.
- Track daily count.
- Support snooze.
- Respect Focus Mode.

## Acceptance Criteria

- Toggle creates alarm.
- Interval validation enforced.
- Counter increments.
- Restart preserves state.

## Test Cases

- Enable posture → wait for trigger.
- Restart Chrome → verify.
- Activate focus → confirm suppression.

---

# TICKET 3.4 – Implement Break Reminder

## Title

Add break reminder

## Description

Same structure as posture.

Default interval: 60 minutes.

Must track daily count.

## Acceptance Criteria

- Alarm fires at correct interval.
- Counter increments.
- Snooze works.
- Grouping works.

## Test Cases

- Enable break reminder.
- Trigger multiple reminders simultaneously → grouped notification.

---

# TICKET 3.5 – Implement Eye Reminder

## Title

Add eye rest reminder (20-20 style)

## Description

Default interval: 20 minutes.

No countdown timer required.

## Acceptance Criteria

- Fires at correct interval.
- Counter increments.
- Snooze works.
- Restart safe.

## Test Cases

- TC-03 logic reuse.
- Restart validation.

---

# TICKET 3.6 – Implement Stand Reminder

## Title

Add stand reminder

## Description

Default interval: 45 minutes.

Reuse generic interval logic.

## Acceptance Criteria

- Scheduling correct.
- Counter increments.
- Grouping works.
- No duplicate alarms.

## Test Cases

- Enable + restart.
- Simultaneous trigger with another reminder.

---

# TICKET 3.7 – Implement Stretch Reminder

## Title

Add stretch reminder

## Description

Default interval: 60 minutes.

No new engine changes.

## Acceptance Criteria

- Interval scheduling works.
- Counter increments.
- Snooze works.

## Test Cases

- Enable and wait.
- Disable before firing → confirm cancellation.

---

# TICKET 3.8 – Implement Breathing Reminder

## Title

Add breathing reminder

## Description

Default interval: 90 minutes.

Tracks daily count only.

## Acceptance Criteria

- Alarm scheduling correct.
- Counter increments.
- Restart safe.

## Test Cases

- Enable and restart.
- Trigger while focus active → confirm suppression.

---

# TICKET 3.9 – Implement Daily Counter Reset for Movement Reminders

## Title

Extend midnight reset to movement stats

## Description

Update midnight reset logic to reset daily counters for all movement reminders.

Do not reset reminder configuration.

## Acceptance Criteria

- All movement counters reset at midnight.
- No double reset.
- Restart after midnight triggers reset.
- Logs show reset event.

## Test Cases

- Simulate date change.
- Reload extension → verify counters = 0.

---

# TICKET 3.10 – Validate Grouped Notifications Across Multiple Reminder Types

## Title

Verify grouped notification behavior across water + movement reminders

## Description

Test grouping when:

- Water and posture trigger simultaneously.
- Multiple movement reminders trigger simultaneously.

No code changes unless bug discovered.

## Acceptance Criteria

- Single notification shown.
- Bullet list contains all triggered reminders.
- No stacking duplicates.

## Test Cases

- TC-09 Simultaneous Triggers
- Trigger 3 reminders at same time.

---

# TICKET 3.11 – Validate Focus Mode Across All Movement Reminders

## Title

Verify suppression logic for all movement reminders

## Description

Ensure Focus Mode suppresses all interval-based reminders.

No reminder should fire while focus active.

## Acceptance Criteria

- No notifications during focus.
- Logs show suppression.
- Reminders resume after focus ends.

## Test Cases

- Activate focus.
- Wait for scheduled movement reminder.
- Confirm suppression.

---

# Milestone 3 Definition of Done

Milestone 3 is complete only if:

- All six movement reminders functional.
- No new scheduling logic introduced.
- All counters reset correctly.
- Grouped notifications verified.
- Focus suppression verified.
- Restart tested.
- Disable/re-enable tested.
- No duplicate alarms.
- No console errors.

Only after Milestone 3 is stable should Work Schedule logic be implemented.

---

## Milestone 4: Work Schedule System (Fixed-Time Reminders)

Goal:
Implement fixed-time scheduling for:

- Work Start
- Lunch Break
- Work End

This milestone introduces:

- Fixed-time scheduling logic
- Weekday filtering
- Timezone auto-detect
- Timezone override
- Immediate recalculation behavior

No UI redesign allowed.
No interval logic modification allowed.

Each ticket must be independently mergeable.

---

# TICKET 4.1 – Extend Schema for Work Schedule Reminders

## Title

Add workStart, workLunch, workEnd reminder objects to schema

## Description

Extend storage schema to include:

- workStart
- workLunch
- workEnd

Each must include:

- id
- enabled: false
- type: "fixedTime"
- timeOfDay: "09:00" (default values)
- workdays: [1,2,3,4,5]
- metadata:
  - soundEnabled: true

Default times:

- Work Start: 09:00
- Lunch: 12:00
- Work End: 22:00

## Acceptance Criteria

- All three objects exist after initialization.
- Defaults correctly applied.
- No schema corruption.

## Test Cases

- Fresh install → inspect storage.
- Reset data → verify structure recreated.

---

# TICKET 4.2 – Implement Next-Occurrence Calculation Utility

## Title

Create utility to calculate next valid fixed-time occurrence

## Description

Implement function:

calculateNextFixedTimestamp(timeOfDay, workdays, timezone)

Rules:

- Convert HH:mm to next valid timestamp.
- If today is valid workday AND time not passed → schedule today.
- If time passed → schedule next valid workday.
- Respect timezone override.

Must return UTC timestamp.

## Acceptance Criteria

- Correct next-day scheduling.
- Correct weekday filtering.
- Handles Sunday/Monday boundary correctly.
- No negative timestamps.

## Test Cases

- Time earlier than now → schedule tomorrow.
- Today not in workdays → schedule next valid day.
- Sunday → schedule Monday.

---

# TICKET 4.3 – Integrate Fixed-Time Scheduling into Engine

## Title

Connect scheduleFixedReminder() to next-occurrence utility

## Description

Use calculateNextFixedTimestamp() inside scheduleFixedReminder().

When alarm fires:

- Immediately calculate next occurrence.
- Reschedule alarm.

Must not use periodInMinutes for fixed-time reminders.

## Acceptance Criteria

- Alarm fires exactly at configured time.
- Reschedules itself after firing.
- No duplicate alarms.
- Logs show scheduled timestamp.

## Test Cases

- Set reminder 2 minutes ahead → confirm trigger.
- Inspect alarm after firing → verify next occurrence scheduled.

---

# TICKET 4.4 – Implement Work Start UI Card

## Title

Add Work Start reminder card to dashboard

## Description

Create UI card for Work Start.

Collapsed state:

- Icon
- Label
- Time display
- Toggle

Expandable state:

- Time picker input
- Weekday selector
- Sound toggle

## Acceptance Criteria

- UI renders correctly.
- Toggle updates storage.
- Time picker updates storage.
- Weekday selection updates storage.

## Test Cases

- Change time → reload → persists.
- Toggle ON → verify alarm scheduled.

---

# TICKET 4.5 – Implement Work Lunch UI Card

## Title

Add Lunch reminder card

## Description

Same structure as Work Start.

No additional scheduling logic.

## Acceptance Criteria

- Scheduling correct.
- UI consistent.
- Restart safe.

## Test Cases

- Enable lunch reminder.
- Wait for trigger.
- Restart and verify.

---

# TICKET 4.6 – Implement Work End UI Card

## Title

Add Work End reminder card

## Description

Same structure as Work Start and Lunch.

## Acceptance Criteria

- Scheduling correct.
- No duplication.
- UI consistent.

## Test Cases

- Set end time.
- Restart and verify.

---

# TICKET 4.7 – Implement Weekday Selector Component

## Title

Build reusable weekday selector UI component

## Description

Create component allowing selection of weekdays (Mon–Sun).

Rules:

- Default [1,2,3,4,5].
- Must update workdays array in storage.
- Must trigger immediate rescheduling if reminder enabled.

## Acceptance Criteria

- Selecting/deselecting days updates storage.
- Enabled reminder recalculates immediately.
- No invalid states (at least one day required).

## Test Cases

- Remove Friday → verify no Friday trigger.
- Remove all days → prevent save.

---

# TICKET 4.8 – Implement Timezone Auto-Detection

## Title

Detect system timezone automatically

## Description

On startup:

- Detect system timezone using Intl API.
- Store "auto" as default.

## Acceptance Criteria

- Default mode uses system timezone.
- No manual override required.
- No crash on detection.

## Test Cases

- Inspect detected timezone.
- Restart → remains auto.

---

# TICKET 4.9 – Implement Timezone Override Dropdown

## Title

Add timezone override selection UI

## Description

Add dropdown listing common IANA timezone strings.

When selected:

- Save override.
- Immediately recalculate all fixed-time alarms.

## Acceptance Criteria

- Changing timezone recalculates alarms instantly.
- No duplicate alarms created.
- Restart preserves override.

## Test Cases

- Enable work reminder.
- Change timezone.
- Verify next scheduled timestamp updated.

---

# TICKET 4.10 – Implement Immediate Recalculation Logic

## Title

Recalculate fixed-time alarms on config change

## Description

When user changes:

- Time
- Workdays
- Timezone

Engine must:

- Cancel old alarm.
- Calculate new timestamp.
- Create new alarm.

## Acceptance Criteria

- No duplicate alarms.
- No stale scheduling.
- Logs reflect recalculation.

## Test Cases

- Change time from 09:00 to 10:00 → verify update.
- Change workdays → verify next occurrence correct.

---

# TICKET 4.11 – Validate Focus Mode Compatibility

## Title

Ensure fixed-time reminders respect Focus Mode

## Description

If fixed-time alarm fires during focus:

- Suppress notification.
- Do not reschedule incorrectly.

## Acceptance Criteria

- No notification during focus.
- Next occurrence scheduled correctly.
- No missed scheduling drift.

## Test Cases

- Activate focus.
- Wait for work reminder time.
- Confirm suppression.

---

# TICKET 4.12 – Validate Restart & Edge Cases

## Title

Verify restart safety for fixed-time reminders

## Description

Test:

- Browser restart
- Disable/re-enable extension
- System time manual change
- DST change (if possible)

No code change unless bug found.

## Acceptance Criteria

- No duplicate alarms.
- No missed triggers.
- Next occurrence correct.
- No console errors.

## Test Cases

- TC-26 Restart
- TC-27 Disable/Re-enable
- Manual system time shift test

---

# Milestone 4 Definition of Done

Milestone 4 is complete only if:

- All three work schedule reminders functional.
- Weekday filtering correct.
- Timezone override works.
- Immediate recalculation verified.
- Restart safe.
- Focus suppression safe.
- No duplicate alarms.
- No console errors.

## Time math must be stable before moving forward.

## Milestone 5: Focus Mode (Global Suppression System)

Goal:
Implement Focus Mode that suppresses all reminders temporarily.

Focus Mode must:

- Suppress ALL reminder notifications
- Not queue missed reminders
- Persist across restart
- Resume correctly
- Provide countdown UI
- Use same notification sound on completion

No scheduling logic may be modified beyond suppression checks.

Each ticket must be independently mergeable.

---

# TICKET 5.1 – Extend Schema for Focus State

## Title

Add focusUntil and focus metadata to settings schema

## Description

Extend settings object:

- focusUntil: null | timestamp
- focusDurationMinutes: default 60

Do not activate focus by default.

## Acceptance Criteria

- focusUntil exists in storage.
- Default value = null.
- No schema corruption.

## Test Cases

- Fresh install → verify focus fields.
- Reset data → verify schema intact.

---

# TICKET 5.2 – Implement Focus Activation Logic

## Title

Add startFocus(durationMinutes) function in engine

## Description

When Focus starts:

- Set focusUntil = currentTime + duration
- Save to storage
- Log event
- Dismiss active notifications
- Do not modify existing reminder alarms

## Acceptance Criteria

- focusUntil stored correctly.
- Active notifications dismissed.
- Log entry created.
- No alarm deleted.

## Test Cases

- Activate focus.
- Inspect storage.
- Verify no alarms removed.

---

# TICKET 5.3 – Implement Focus Suppression Gate

## Title

Add suppression check inside handleAlarm()

## Description

Before sending notification:

- If currentTime < focusUntil → suppress
- Log suppression event
- Do not queue reminder
- Continue scheduling normally

## Acceptance Criteria

- No notification appears during focus.
- Alarm still reschedules properly.
- Log shows suppression.
- No scheduling drift.

## Test Cases

- Activate focus.
- Wait for interval reminder.
- Confirm no notification.

---

# TICKET 5.4 – Implement Focus Completion Alarm

## Title

Create focus completion notification

## Description

When focusUntil reached:

- Send completion notification.
- Use same default Chrome sound.
- Clear focusUntil in storage.
- Log completion.

Must not interfere with reminder scheduling.

## Acceptance Criteria

- Completion notification appears exactly once.
- focusUntil reset to null.
- Sound plays.
- Log created.

## Test Cases

- Activate focus (short duration).
- Wait until end.
- Verify behavior.

---

# TICKET 5.5 – Implement Focus Manual Stop

## Title

Add stopFocus() logic with 1-minute resume buffer

## Description

When user stops focus manually:

- Set focusUntil = currentTime + 1 minute buffer
- Log event

After buffer expires:

- Clear focusUntil

Do not resume immediately.

## Acceptance Criteria

- Reminders resume only after 1-minute buffer.
- No immediate notification flood.
- Logs show stop + resume.

## Test Cases

- Activate focus.
- Stop early.
- Wait 1 minute.
- Confirm reminders resume.

---

# TICKET 5.6 – Implement Focus Countdown UI

## Title

Add live countdown display in popup

## Description

When focus active:

- Display remaining time (mm:ss).
- Update every second.
- Countdown must not use persistent background interval.
- Use popup-only timer.

If popup closed → no background timer required.

## Acceptance Criteria

- Countdown accurate.
- UI updates smoothly.
- No memory leaks.
- Restart preserves countdown state.

## Test Cases

- Activate focus.
- Open popup → verify countdown.
- Close popup → reopen → verify correct remaining time.

---

# TICKET 5.7 – Implement Focus Button UI

## Title

Add Start/Stop Focus button in dashboard

## Description

Add Focus control section:

- Start button
- Stop button (when active)
- Duration selector (default 60 minutes)

Buttons must call engine functions.

## Acceptance Criteria

- Button state reflects focus status.
- Duration selectable.
- Restart preserves state.

## Test Cases

- Start focus.
- Restart extension.
- Verify focus still active.

---

# TICKET 5.8 – Validate Interaction with Interval Reminders

## Title

Verify interval reminders resume correctly after focus

## Description

Test that:

- No queued reminders fire immediately after focus ends.
- Interval timing continues normally.

No code change unless bug found.

## Acceptance Criteria

- No notification flood after focus.
- Interval schedule remains consistent.
- No alarm duplication.

## Test Cases

- Activate focus during interval.
- Let focus expire.
- Observe next interval firing.

---

# TICKET 5.9 – Validate Interaction with Fixed-Time Reminders

## Title

Verify fixed-time reminders behave correctly during focus

## Description

If fixed-time alarm fires during focus:

- Suppress notification.
- Next occurrence scheduled normally.

Must not skip future occurrences.

## Acceptance Criteria

- Suppressed event logged.
- Next scheduled time correct.
- No duplicate alarm.

## Test Cases

- Activate focus before workStart.
- Wait past workStart time.
- Confirm suppression.
- Verify next occurrence scheduled.

---

# TICKET 5.10 – Restart & Edge Case Validation

## Title

Ensure focus mode survives restart and edge cases

## Description

Test:

- Restart Chrome while focus active
- Disable/enable extension
- System time change
- Very short duration (1 min)

No code changes unless bug discovered.

## Acceptance Criteria

- focusUntil preserved.
- Countdown accurate after restart.
- No scheduling drift.
- No console errors.

## Test Cases

- Activate focus.
- Restart browser.
- Verify behavior.

---

# Milestone 5 Definition of Done

Milestone 5 is complete only if:

- Focus suppresses ALL reminders.
- No reminders queued.
- Countdown accurate.
- Manual stop buffer works.
- Completion notification works.
- Restart safe.
- No duplicate alarms.
- No scheduling drift.
- No console errors.

## Focus Mode must not introduce instability into the engine.

## Milestone 6: Notes System

Goal:
Implement lightweight daily notes functionality that:

- Saves automatically
- Supports multi-line input
- Supports completion state
- Moves completed notes to bottom
- Enforces 10,000 character limit
- Allows up to 50 notes (warn after 50)
- Persists across restart
- Does NOT interfere with reminder engine

Notes must remain simple and fast.

Each ticket must be independently mergeable.

---

# TICKET 6.1 – Extend Schema for Notes

## Title

Add notes array to storage schema

## Description

Ensure schema includes:

notes: []

Each note object must follow:

{
id: string,
text: string,
completed: boolean,
createdAt: timestamp
}

## Acceptance Criteria

- notes array exists in storage.
- Fresh install initializes empty array.
- No schema corruption.

## Test Cases

- Fresh install → inspect storage.
- Reset data → verify notes array recreated.

---

# TICKET 6.2 – Create Notes Section UI

## Title

Add notes section to main dashboard

## Description

Add notes section below reminders.

Must include:

- Input area
- Add button (optional if auto-create)
- Notes list container

UI must:

- Match design tokens
- Be minimal
- Be grouped and collapsible (collapsed by default)

## Acceptance Criteria

- Section renders correctly.
- Expand/collapse works.
- No layout shifts.
- No console errors.

## Test Cases

- Open popup → verify layout.
- Expand/collapse multiple times.

---

# TICKET 6.3 – Implement Note Creation Logic

## Title

Add note creation and ID generation logic

## Description

When user types:

- Create new note object
- Assign unique ID
- Set completed = false
- Set createdAt timestamp
- Save immediately

No manual save button required.

## Acceptance Criteria

- Note created automatically.
- Unique ID generated.
- Persisted in storage.
- Reload preserves note.

## Test Cases

- Type text → reload popup → note remains.
- Inspect storage → correct structure.

---

# TICKET 6.4 – Implement Auto-Save on Typing

## Title

Save note content on input change

## Description

On every text input change:

- Update note text in storage
- Avoid excessive writes (debounce recommended)

Must not cause performance lag.

## Acceptance Criteria

- Edits persist immediately.
- No typing lag.
- No console errors.

## Test Cases

- Type rapidly.
- Reload popup → changes preserved.

---

# TICKET 6.5 – Enforce 10,000 Character Limit

## Title

Add character limit validation

## Description

Prevent text exceeding 10,000 characters.

Behavior:

- Hard limit (prevent further input)
  OR
- Soft limit (truncate automatically)

No crash allowed.

## Acceptance Criteria

- Text never exceeds 10,000 chars.
- No UI freeze.
- No storage corruption.

## Test Cases

- Paste >10,000 characters.
- Verify limit enforcement.

---

# TICKET 6.6 – Implement Note Completion Toggle

## Title

Add completed state toggle for notes

## Description

When user marks note complete:

- Set completed = true
- Update storage
- Move note to bottom of list immediately

Unchecking moves it back above completed notes.

## Acceptance Criteria

- Completed notes move to bottom.
- State persists after restart.
- No ordering glitches.

## Test Cases

- Mark complete → verify order.
- Restart → verify order preserved.

---

# TICKET 6.7 – Implement Note Reordering (Manual Drag)

## Title

Add manual drag-and-drop reordering

## Description

Allow user to reorder active notes manually.

Store order in notes array.

Completed notes remain grouped at bottom.

## Acceptance Criteria

- Drag changes order.
- Order persists after restart.
- No duplication.
- No data loss.

## Test Cases

- Reorder notes.
- Reload extension.
- Verify order retained.

---

# TICKET 6.8 – Implement 50-Note Warning

## Title

Add soft warning when note count exceeds 50

## Description

When notes.length > 50:

- Show non-blocking warning message.
- Still allow creation.

Do not prevent creation.

## Acceptance Criteria

- Warning appears after 50 notes.
- No crash.
- Performance stable.

## Test Cases

- Create 51 notes.
- Verify warning shown.
- Restart → no data loss.

---

# TICKET 6.9 – Implement Empty Note Auto-Delete

## Title

Remove note if text becomes empty

## Description

If user deletes all text:

- Remove note object from storage.
- Update UI immediately.

## Acceptance Criteria

- Empty notes do not persist.
- No orphan blank entries.
- No storage corruption.

## Test Cases

- Create note.
- Delete all text.
- Reload → note gone.

---

# TICKET 6.10 – Performance Validation (50 Notes)

## Title

Validate performance with 50+ notes

## Description

Test performance manually:

- 50+ notes
- Multi-line content
- Reordering
- Rapid typing

No engine interaction allowed.

## Acceptance Criteria

- Popup loads under 300ms.
- No typing lag.
- No memory leaks.
- No console errors.

## Test Cases

- Create 50 notes.
- Rapid typing test.
- Restart test.

---

# Milestone 6 Definition of Done

Milestone 6 is complete only if:

- Notes persist correctly.
- Auto-save stable.
- Completion logic stable.
- Order preserved across restart.
- Character limit enforced.
- 50-note warning implemented.
- No performance degradation.
- Reminder engine unaffected.
- No console errors.

Notes must remain lightweight and not compromise system stability.

---

## Milestone 7: Advanced Settings, Debug & Stability Layer

Goal:
Provide system-level controls and debugging tools without affecting core scheduling logic.

This milestone includes:

- Advanced settings panel
- Debug log viewer
- Raw JSON export
- Reset data flow
- Master disable toggle
- Corruption recovery validation

No scheduling logic changes allowed unless fixing a bug.

Each ticket must be independently mergeable.

---

# TICKET 7.1 – Create Advanced Settings Section UI

## Title

Add collapsible Advanced Settings panel

## Description

Add a collapsible section at bottom of popup.

Collapsed by default.

Must contain placeholder sections for:

- Debug Logs
- Export
- Reset
- Master Toggle
- Timezone Override (if not already inside work schedule)

## Acceptance Criteria

- Section collapsed by default.
- Expand/collapse works.
- No layout shifts.
- No console errors.

## Test Cases

- Expand and collapse multiple times.
- Restart extension → remains collapsed.

---

# TICKET 7.2 – Implement Debug Log Viewer UI

## Title

Display persistent logs inside Advanced Settings

## Description

Display logs stored in storage.logs.

Requirements:

- Scrollable container
- Show timestamp
- Show level (INFO/WARN/ERROR)
- Reverse chronological order

Read-only.

## Acceptance Criteria

- Logs visible in UI.
- No editing allowed.
- Log entries accurate.
- No performance lag.

## Test Cases

- Trigger reminder.
- Open debug panel.
- Verify log entry visible.

---

# TICKET 7.3 – Enforce Log Size Limit

## Title

Ensure log buffer does not exceed 100 entries

## Description

When logs exceed 100:

- Remove oldest entries.
- Keep most recent 100.

Must happen at write time.

## Acceptance Criteria

- Logs capped at 100.
- No memory growth.
- No storage overflow.

## Test Cases

- Generate 120+ log events.
- Inspect storage → only 100 remain.

---

# TICKET 7.4 – Implement Raw JSON Export

## Title

Add export full storage JSON button

## Description

When user clicks Export:

- Download full rhythmData as raw JSON file.
- File name format: rhythm-backup-YYYYMMDD.json

No formatting changes.
No modification to storage.

## Acceptance Criteria

- File downloads successfully.
- JSON valid and complete.
- No UI freeze.

## Test Cases

- Export file.
- Open file → validate structure.

---

# TICKET 7.5 – Implement Reset Data Flow

## Title

Add full reset with confirmation dialog

## Description

When user clicks Reset:

- Show confirmation dialog.
- If confirmed:
  - Clear storage.
  - Reinitialize schema.
  - Cancel all alarms.
  - Log reset event.

## Acceptance Criteria

- Confirmation required.
- All reminders disabled after reset.
- Notes cleared.
- Logs reset.
- No orphan alarms remain.

## Test Cases

- Enable reminders.
- Add notes.
- Click reset.
- Verify clean state.
- Restart → still clean.

---

# TICKET 7.6 – Implement Master Disable Toggle

## Title

Add global master toggle for all reminders

## Description

Add masterEnabled in settings.

When OFF:

- Suppress all reminder notifications.
- Do NOT delete alarms.
- Log suppression.

When ON:

- Resume normal behavior.

## Acceptance Criteria

- No notifications while master disabled.
- Alarms remain scheduled.
- Restart preserves state.

## Test Cases

- Enable reminders.
- Turn master OFF.
- Wait for trigger → confirm suppression.
- Turn master ON → confirm resume.

---

# TICKET 7.7 – Validate Corrupted Storage Recovery

## Title

Auto-reset on corrupted storage detection

## Description

If storage structure invalid:

- Log error.
- Clear storage.
- Reinitialize schema.
- Continue safely.

Must not crash.

## Acceptance Criteria

- Corrupted storage does not crash extension.
- Schema reinitialized automatically.
- Logs reflect recovery event.

## Test Cases

- Manually corrupt storage via DevTools.
- Reload extension.
- Verify recovery.

---

# TICKET 7.8 – Validate Alarm Cleanup on Reset

## Title

Ensure no orphan alarms remain after reset

## Description

After reset:

- chrome.alarms.getAll() should return empty (except midnight reset).
- No lingering reminder alarms.

## Acceptance Criteria

- All reminder alarms removed.
- Midnight reset recreated properly.
- No duplicate alarms.

## Test Cases

- Enable multiple reminders.
- Reset data.
- Inspect alarms.

---

# TICKET 7.9 – Performance & Stability Audit

## Title

Perform final console and performance audit

## Description

Validate:

- No console errors
- No unhandled promise rejections
- Popup loads < 300ms
- No unnecessary re-renders
- No polling loops in background

No code changes unless bug found.

## Acceptance Criteria

- Clean console.
- Stable performance.
- All milestone test cases pass.
- No duplicate alarms.

## Test Cases

- Open popup repeatedly.
- Restart browser.
- Enable multiple reminders.
- Activate focus.
- Trigger grouped notifications.

---

# Milestone 7 Definition of Done

Milestone 7 is complete only if:

- Advanced panel stable.
- Debug logs visible and capped.
- JSON export works.
- Reset flow stable.
- Master toggle works.
- Corruption recovery safe.
- No orphan alarms.
- No console errors.
- All prior milestone test cases still pass.

This milestone prepares the system for production release.

---

## Milestone 8: Hardening, Regression & Release Preparation

Goal:
Prepare Rhythm for stable release.

This milestone focuses on:

- Regression testing
- Edge-case validation
- Performance verification
- Versioning discipline
- Store preparation

No new features allowed.
Only fixes.

Each ticket must be independently mergeable.

---

# TICKET 8.1 – Full Restart Regression Validation

## Title

Validate all reminder types across browser restart

## Description

Manually test:

- Interval reminders
- Fixed-time reminders
- Water counter
- Movement counters
- Focus mode
- Notes persistence

Restart Chrome fully.

No code change unless bug discovered.

## Acceptance Criteria

- All alarms recreated.
- No duplicate alarms.
- Focus state preserved.
- Counters intact.
- No console errors.

## Test Cases

- TC-26 Restart Browser
- Full regression sweep.

---

# TICKET 8.2 – Disable/Re-enable Extension Validation

## Title

Validate behavior after extension disable and re-enable

## Description

Disable extension from Chrome extensions panel.
Re-enable extension.

Verify:

- recreateAllReminders() runs correctly.
- No duplicate alarms.
- No lost reminders.

## Acceptance Criteria

- All alarms restored.
- No duplicate scheduling.
- No crash.

## Test Cases

- TC-27 Disable & Re-enable Extension

---

# TICKET 8.3 – System Time Change Validation

## Title

Validate behavior when system time changes

## Description

Manually adjust system clock forward and backward.

Test:

- Interval reminders
- Fixed-time reminders
- Midnight reset logic
- Focus mode timing

No code change unless bug discovered.

## Acceptance Criteria

- No infinite loops.
- No alarm duplication.
- No missed scheduling drift.
- Midnight reset correct.

## Test Cases

- Move system time +2 hours.
- Move system time -2 hours.
- Cross midnight manually.

---

# TICKET 8.4 – DST & Timezone Stress Test

## Title

Validate timezone override edge cases

## Description

Change timezone override multiple times.

Verify:

- Immediate recalculation.
- No duplicate alarms.
- Correct next occurrence.

No code change unless bug discovered.

## Acceptance Criteria

- Recalculation accurate.
- No stacking alarms.
- Logs reflect change.

## Test Cases

- Switch timezone to different region.
- Restart extension.
- Verify behavior.

---

# TICKET 8.5 – Simultaneous Trigger Stress Test

## Title

Test multiple reminders firing at same second

## Description

Configure:

- Water
- Posture
- Break
- Work Start

To fire at same minute.

Verify grouping buffer handles 3–4 triggers.

## Acceptance Criteria

- Single notification shown.
- Bullet list includes all.
- No duplicate stacked notifications.

## Test Cases

- TC-09 Simultaneous Triggers (multi-reminder version)

---

# TICKET 8.6 – Performance Audit

## Title

Validate popup performance and memory stability

## Description

Test with:

- 50+ notes
- All reminders enabled
- Focus active
- Debug logs near 100 entries

Measure:

- Popup load time
- UI responsiveness

## Acceptance Criteria

- Popup loads under 300ms.
- No typing lag.
- No visible UI freeze.
- No memory spikes.

## Test Cases

- Manual stress test.
- Open popup 20+ times quickly.

---

# TICKET 8.7 – Console & Error Audit

## Title

Ensure zero console errors and warnings

## Description

Open DevTools.

Interact with:

- All reminders
- Focus mode
- Notes
- Reset
- Export
- Master toggle

No console errors allowed.

## Acceptance Criteria

- No red errors.
- No unhandled promise rejections.
- No warning spam.
- No debug logs left unintentionally.

---

# TICKET 8.8 – Versioning & Tagging

## Title

Set initial release version and tag repository

## Description

Update version in manifest.json.

Use semantic versioning:

- v1.0.0 for initial release.

Create git tag:

```

git tag v1.0.0
git push origin v1.0.0

```

## Acceptance Criteria

- Version updated correctly.
- Tag pushed.
- Main branch stable.

---

# TICKET 8.9 – Prepare Store Assets

## Title

Create store listing assets

## Description

Prepare:

- Icons (16, 32, 48, 128)
- Screenshots (popup UI)
- Store description
- Privacy declaration (no data collection)

## Acceptance Criteria

- Icons render properly.
- Description accurate.
- No unnecessary permissions flagged.

---

# TICKET 8.10 – Code Freeze & Final Regression

## Title

Initiate code freeze and final validation sweep

## Description

After tagging:

- No new features allowed.
- Only critical bug fixes allowed.
- Run full regression checklist.

## Acceptance Criteria

- All previous milestone test cases pass.
- No duplicate alarms.
- No missed midnight reset.
- No focus drift.
- No console errors.

---

# Final Release Criteria

Rhythm v1.0.0 is ready only if:

- All milestone test cases pass.
- All edge cases validated.
- No scheduling drift.
- No duplicate alarms.
- No storage corruption.
- No console errors.
- Performance stable.
- Restart safe.
- Focus safe.
- Timezone safe.

If any critical issue discovered:

- Create hotfix branch.
- Fix.
- Increment PATCH version (1.0.1).
- Retag.

---

# Final Rule

Each ticket must:

- Be independently mergeable.
- Include related test cases in PR.
- Pass restart test.
- Not modify unrelated systems.
