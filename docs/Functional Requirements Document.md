# Rhythm – Functional Requirements Document (FRD)

Version: 1.0

---

# 1. Overview

Rhythm is a lightweight Chrome Extension that provides structured daily reminders for schedule discipline and wellbeing.

This document defines:

- User-visible behaviors
- System responses
- Interaction flows
- Edge case handling

No implementation details are included here.

---

# 2. Global Application Behavior

## 2.1 Launch Behavior

- Opening the extension always loads the **Main Dashboard**.
- No onboarding in V1.
- All reminders are **disabled by default**.
- No global status banner.

## 2.2 Global Controls

- A global master toggle must allow disabling all reminders.
- Reminders are grouped and **collapsed by default**.
- Enabled reminders must visually stand out from disabled ones.

---

# 3. Reminder Behavior

## 3.1 General Rules

- Minimum interval: 5 minutes.
- Invalid interval values are auto-corrected.
- Maximum reminders allowed: 10.
- When max reached, “Add Reminder” button becomes disabled with explanatory message.
- Changing interval while active resets the timer immediately.
- Disabling reminder during snooze cancels snooze.
- All reminders are suppressed during Focus Mode.

---

# 4. Water Reminder

## 4.1 Defaults

- Default interval: 15 minutes.
- Default unit: glasses.
- Default target: 8.

## 4.2 Logging

- “Log” increments by +1.
- Exceeding target is allowed.
- Counter resets daily at midnight.
- Completion does NOT prevent further logging.

## 4.3 Completion State

- Upon reaching target:
  - Subtle confetti-style micro animation triggers.
  - Celebration can trigger multiple times per day.

---

# 5. Movement Reminders

Includes:

- Posture
- Break
- Eye Rest
- Stand
- Stretch
- Breathing

## 5.1 Behavior

- Track daily count.
- “Done” increments counter.
- Ignored reminders do not retry.
- No countdown timer for breaks in V1.

---

# 6. Work Schedule

Includes:

- Work Start
- Lunch
- Work End

## 6.1 Configuration

- Each event optional.
- Default: weekends skipped.
- User can select custom workdays.
- System timezone auto-detected.
- Manual override available.

## 6.2 Activation Rules

- If enabled after today’s time passed → schedule for tomorrow.
- Changing timezone recalculates alarms immediately.
- Changing workdays applies immediately.
- No repeat notifications if ignored.

---

# 7. Focus Mode

## 7.1 Activation

- Default duration: 1 hour.
- Manual stop allowed.
- On manual stop, reminders resume after 1-minute buffer.

## 7.2 Behavior

- Suppresses all reminders.
- Does not queue missed reminders.
- Persists across restart.
- Displays live countdown in popup.

## 7.3 Completion

- When focus ends:
  - Notification sent.
  - Uses same notification sound.

- If focus enabled while notification visible:
  - Current notification dismissed.

---

# 8. Notes

## 8.1 Behavior

- Save on typing.
- Multi-line allowed.
- Max characters per note: 10,000.
- Completed notes remain visible.
- Completed notes move to bottom immediately.
- Maximum notes: 50.
- If limit exceeded:
  - Allow creation.
  - Show warning message.

## 8.2 Empty Notes

- Empty notes auto-delete.

---

# 9. Notifications

## 9.1 General

- Use default Chrome notification sound.
- Sound configurable per reminder.
- Auto-dismiss after 5 minutes.
- Clicking notification body does nothing.

## 9.2 Snooze

- All reminders support snooze.
- Fixed snooze duration: 5 minutes.
- Snooze creates one-time temporary alarm.

## 9.3 Grouping

- If multiple reminders trigger simultaneously:
  - Single notification.
  - Bullet list of reminder titles.

## 9.4 Missed Reminders

- If auto-dismissed:
  - Log as “missed”.
  - Not shown in UI.

---

# 10. Advanced Settings

## 10.1 Structure

- Collapsible section.
- Includes:
  - Debug logs
  - Timezone override
  - Sound toggles
  - Reset data
  - Export data

## 10.2 Export

- Raw JSON download.
- No import in V1.

## 10.3 Reset

- Reset requires confirmation dialog.

---

# 11. Logging

- Logs stored persistently.
- Visible in hidden Debug panel.
- Missed reminders logged.
- Circular buffer recommended.

---

# 12. Data Integrity

- On corrupted storage detection:
  - Automatically reset safely.
  - No user interruption.

- On extension disable/re-enable:
  - Alarms automatically rehydrated.

---

# 13. Time Handling

- Internal timestamps stored in UTC.
- Display in user locale.
- System time authoritative.
- Timezone auto-detected with override option.

---

# 14. Performance Requirements

- Popup loads under 300ms.
- No polling loops.
- Event-driven behavior only.
- No external network calls.

---

# 15. Offline Guarantee

- Fully functional without internet.
- Uses system fonts only.
- No remote dependencies.
