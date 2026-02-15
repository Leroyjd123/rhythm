# Rhythm – Test Cases Document

Version: 1.0

All test cases must pass before marking a milestone complete.

---

# SECTION 1 – Installation & Initialization

## TC-01: Fresh Install

**Steps**

1. Install extension.
2. Open popup.

**Expected Result**

- No console errors.
- Dashboard loads.
- All reminders disabled.
- Schema initialized with schemaVersion = 1.
- Storage key "rhythmData" exists.

---

## TC-02: Storage Initialization

**Steps**

1. Clear storage manually.
2. Reload extension.

**Expected Result**

- Storage reinitialized.
- No crash.
- Default structure recreated.

---

# SECTION 2 – Reminder Engine Core

## TC-03: Enable Interval Reminder

**Steps**

1. Enable Water reminder.
2. Set interval to 15 minutes.

**Expected Result**

- Alarm created.
- Log entry created.
- Reminder fires after interval.
- Notification appears.

---

## TC-04: Minimum Interval Enforcement

**Steps**

1. Set interval to 1 minute.

**Expected Result**

- Value auto-corrected to 5 minutes.
- Alarm created using 5 minutes.
- No crash.

---

## TC-05: Disable Reminder

**Steps**

1. Enable reminder.
2. Disable reminder before it fires.

**Expected Result**

- Alarm canceled.
- No notification fires.
- No residual snooze alarms.

---

## TC-06: Change Interval While Active

**Steps**

1. Enable Water (15 min).
2. Change to 30 min.

**Expected Result**

- Old alarm canceled.
- New alarm created.
- Timer resets immediately.

---

# SECTION 3 – Snooze

## TC-07: Snooze Behavior

**Steps**

1. Trigger reminder.
2. Click Snooze.
3. Wait 5 minutes.

**Expected Result**

- One-time alarm created.
- Notification reappears after 5 minutes.
- Recurring schedule unaffected.

---

## TC-08: Disable During Snooze

**Steps**

1. Trigger reminder.
2. Click Snooze.
3. Disable reminder before snooze fires.

**Expected Result**

- Snooze alarm canceled.
- No notification appears.

---

# SECTION 4 – Grouped Notifications

## TC-09: Simultaneous Triggers

**Steps**

1. Configure two reminders with same interval.
2. Wait for both to trigger.

**Expected Result**

- Single notification appears.
- Contains bullet list with both reminders.
- No duplicate separate notifications.

---

# SECTION 5 – Focus Mode

## TC-10: Activate Focus Mode

**Steps**

1. Enable reminder.
2. Activate Focus Mode.
3. Wait for scheduled trigger.

**Expected Result**

- No notification appears.
- Log indicates suppression.

---

## TC-11: Focus End

**Steps**

1. Activate Focus.
2. Wait until expiration.

**Expected Result**

- Completion notification appears.
- Sound plays.
- Reminders resume.

---

## TC-12: Manual Stop

**Steps**

1. Activate Focus.
2. Stop manually.
3. Wait 1 minute.

**Expected Result**

- Reminders resume after 1-minute buffer.
- No immediate notification firing.

---

# SECTION 6 – Midnight Reset

## TC-13: Midnight Reset Trigger

**Steps**

1. Log water 3 times.
2. Simulate date change to next day.
3. Reload extension.

**Expected Result**

- Counter resets to 0.
- No duplicate reset.
- lastResetDate updated.

---

# SECTION 7 – Work Schedule

## TC-14: Work Start Reminder

**Steps**

1. Set work start to 2 minutes from now.
2. Wait.

**Expected Result**

- Notification appears at exact time.

---

## TC-15: Enable After Time Passed

**Steps**

1. Set work start earlier than current time.
2. Enable reminder.

**Expected Result**

- Scheduled for next valid day.
- No immediate trigger.

---

## TC-16: Timezone Change

**Steps**

1. Enable work reminder.
2. Change timezone override.

**Expected Result**

- Alarm recalculated immediately.
- Next trigger reflects new timezone.

---

# SECTION 8 – Water Reminder

## TC-17: Log Increment

**Steps**

1. Click Log.

**Expected Result**

- Counter increments by +1.
- Storage updated.

---

## TC-18: Completion Animation

**Steps**

1. Reach daily target.

**Expected Result**

- Subtle confetti animation triggers.
- Animation does not block UI.
- Can trigger again if exceeded.

---

# SECTION 9 – Notes

## TC-19: Create Note

**Steps**

1. Type in note field.

**Expected Result**

- Note auto-saves.
- Appears immediately.

---

## TC-20: Character Limit

**Steps**

1. Paste text > 10,000 characters.

**Expected Result**

- Input restricted.
- No crash.

---

## TC-21: Complete Note

**Steps**

1. Mark note complete.

**Expected Result**

- Note moves to bottom.
- Opacity reduced.

---

## TC-22: 50 Note Limit

**Steps**

1. Create 50 notes.
2. Add one more.

**Expected Result**

- Warning shown.
- Note still created.

---

# SECTION 10 – Advanced Settings

## TC-23: Export JSON

**Steps**

1. Click Export.

**Expected Result**

- Raw JSON file downloads.
- File contains full schema.

---

## TC-24: Reset Data

**Steps**

1. Click Reset.
2. Confirm.

**Expected Result**

- Storage cleared.
- Schema reinitialized.
- All reminders disabled.

---

## TC-25: Master Disable

**Steps**

1. Enable multiple reminders.
2. Toggle master disable.

**Expected Result**

- All alarms canceled.
- No notifications fire.
- State preserved but inactive.

---

# SECTION 11 – Persistence

## TC-26: Restart Browser

**Steps**

1. Enable reminders.
2. Restart Chrome.

**Expected Result**

- Alarms recreated.
- Reminders continue functioning.

---

## TC-27: Disable & Re-enable Extension

**Steps**

1. Disable extension.
2. Re-enable extension.

**Expected Result**

- Alarms restored.
- No duplicate alarms.

---

# SECTION 12 – Corrupted Storage

## TC-28: Corruption Simulation

**Steps**

1. Manually edit storage to invalid structure.
2. Reload extension.

**Expected Result**

- Auto-reset occurs.
- No crash.
- Logs record reset event.

---

# SECTION 13 – Performance

## TC-29: Popup Load Time

**Steps**

1. Open popup multiple times.

**Expected Result**

- Loads under 300ms.
- No noticeable lag.

---

## TC-30: Console Cleanliness

**Steps**

1. Open DevTools.
2. Interact with all features.

**Expected Result**

- No uncaught errors.
- No warning spam.

---

# FINAL RELEASE CHECK

All test cases must pass:

- No duplicate alarms
- No missed resets
- Focus mode stable
- No crashes
- No console errors
- Storage consistent
- Notifications grouped correctly

Only after all test cases pass may the build proceed to Store Preparation.
