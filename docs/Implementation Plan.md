# Rhythm – Implementation Plan

Version: 1.0

This document explains:

- What to build
- How to build it
- Why it must be built that way
- Acceptance criteria for each system

No interpretation required.

---

# 1. System Architecture Overview

Rhythm has 4 layers:

1. Popup UI
2. Background Service Worker (Reminder Engine)
3. Storage Layer
4. Logger

STRICT RULE:
Popup NEVER creates alarms.
Popup NEVER handles scheduling.
All scheduling must occur in background.

---

# 2. Storage Schema (Single Source of Truth)

All data stored under:

```

chrome.storage.local
Key: "rhythmData"

```

## Required Schema

```json
{
  "schemaVersion": 1,

  "settings": {
    "theme": "light",
    "focusUntil": null,
    "timezone": "auto",
    "masterEnabled": true
  },

  "reminders": {
    "water": {},
    "posture": {},
    "break": {},
    "eye": {},
    "stand": {},
    "stretch": {},
    "breathing": {},
    "workStart": {},
    "workLunch": {},
    "workEnd": {}
  },

  "stats": {
    "water": {
      "todayCount": 0,
      "lastResetDate": "YYYY-MM-DD"
    }
  },

  "notes": [],

  "logs": []
}
```

## Reminder Object Structure

```json
{
  "id": "water",
  "enabled": false,
  "type": "interval" | "fixedTime",
  "intervalMinutes": 15,
  "timeOfDay": "09:00",
  "workdays": [1,2,3,4,5],
  "metadata": {
    "dailyTarget": 8,
    "unit": "glasses",
    "soundEnabled": true
  },
  "lastTriggered": null
}
```

---

# Acceptance Criteria – Storage

- Schema initializes automatically if missing.
- schemaVersion present.
- Corrupted storage triggers full reset.
- No partial writes allowed.
- All updates atomic.

---

# 3. Reminder Engine Logic

File: reminder-engine.js

## Required Functions

- initializeEngine()
- createReminder(reminder)
- deleteReminder(id)
- recreateAllReminders()
- handleAlarm(alarm)
- scheduleIntervalReminder(reminder)
- scheduleFixedReminder(reminder)
- cancelReminder(id)
- handleSnooze(id)
- groupNotifications(reminderList)

---

# Reminder Lifecycle

## 1. Enable Reminder

- Save reminder to storage.
- Create alarm immediately.
- Log event.

## 2. Alarm Fires

- Check masterEnabled.
- Check focusUntil.
- If suppressed → exit.
- If allowed → queue notification.
- Log event.

## 3. Snooze

- Create one-time alarm (5 min).
- Do NOT modify recurring schedule.

## 4. Disable Reminder

- Cancel alarm.
- Remove snooze if exists.
- Update storage.

---

# Acceptance Criteria – Engine

- Minimum interval enforced (5 minutes).
- Changing interval resets timer immediately.
- Restart recreates all alarms.
- No duplicate alarms exist.
- Multiple alarms at same timestamp produce ONE grouped notification.
- Focus mode suppresses ALL reminders.
- Re-enable extension restores alarms.
- Logs reflect every state transition.

---

# 4. Midnight Reset Logic

Create daily alarm named "midnightReset".

When triggered:

- Reset stats counters.
- Update lastResetDate.
- Schedule next midnight.

If browser was closed:

- On startup check date.
- If date mismatch → reset immediately.

---

# Acceptance Criteria – Midnight Reset

- Counters reset exactly once per day.
- Restart after midnight triggers reset.
- No double resets.
- No missed resets.

---

# 5. Water Reminder Rules

Default:

- Interval: 15
- Target: 8
- Unit: glasses

Logging:

- +1 increment.
- Exceeding allowed.
- On target reached → trigger subtle confetti.

Confetti must:

- Be very light animation.
- Not block UI.
- Can trigger multiple times per day.

---

# Acceptance Criteria – Water

- Counter visible on dashboard.
- Counter increments properly.
- Reset works.
- Confetti triggers on completion.
- Sound toggle works.
- Focus suppresses.
- Snooze works.

---

# 6. Work Schedule Logic

Rules:

- Weekend skip default ON.
- User can select custom weekdays.
- If enabled after time passed → schedule next valid day.
- Timezone auto-detect.
- Timezone override supported.
- Changing timezone recalculates alarms immediately.

---

# Acceptance Criteria – Work Schedule

- Reminders fire only on selected days.
- Timezone change recalculates correctly.
- No duplicate triggers.
- Restart preserves behavior.

---

# 7. Focus Mode Rules

- Default 1 hour.
- Manual stop allowed.
- Resume after 1-minute buffer.
- Persist across restart.
- Dismiss active notifications.
- Show completion notification with sound.

---

# Acceptance Criteria – Focus

- Suppresses all reminders.
- No reminders queued.
- Countdown updates live.
- Restart preserves focus.
- Manual stop resumes after 1 min.

---

# 8. Notes Rules

- Save on typing.
- Multi-line allowed.
- Max 10,000 characters.
- Max 50 notes.
- If >50 → warn but allow.
- Empty notes auto-delete.
- Completed move to bottom.
- Reorderable.

---

# Acceptance Criteria – Notes

- Persist after restart.
- No lag with 50 notes.
- Sorting stable.
- Character limit enforced.

---

# 9. Notification Rules

- Use default Chrome sound.
- Per-reminder sound toggle.
- Auto-dismiss after 5 minutes.
- Clicking body does nothing.
- Group simultaneous reminders into single notification with bullet list.
- Log missed reminders.

---

# Acceptance Criteria – Notifications

- Grouped correctly.
- Snooze creates one-time alarm.
- Auto-dismiss works.
- Missed logged.
- No stacking duplicates.

---

# 10. Advanced Settings

Must include:

- Debug logs viewer.
- Timezone override dropdown.
- Raw JSON export.
- Reset with confirmation.
- Master disable toggle.

---

# Acceptance Criteria – Advanced

- Export produces valid JSON.
- Reset wipes and reinitializes schema.
- Logs visible.
- Master toggle disables all reminders immediately.

---

# 11. Performance Rules

- Popup loads under 300ms.
- No polling loops.
- Event-driven only.
- No unnecessary re-renders.
- No external dependencies.

---

# 12. Final Release Checklist

- Restart Chrome → reminders still work.
- Disable extension → enable → alarms restored.
- Change timezone → recalculates.
- Trigger simultaneous reminders → grouped.
- Activate focus → no reminders fire.
- Midnight reset works.
- No console errors.
- No duplicate alarms.
- No storage corruption issues.

---

Definition of Done:

All acceptance criteria met.
No unresolved bugs.
No console warnings.
All tests manually verified.
