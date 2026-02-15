# Rhythm – Technical Requirements Document (TRD)

Version: 1.0

---

# 1. System Overview

Rhythm is a lightweight, offline-first Chrome Extension (Manifest V3) designed to provide structured daily reminders for hydration, posture, movement, work schedules, and lightweight note tracking.

The extension:

- Runs fully offline
- Requires no login or cloud services
- Uses Chrome APIs only
- Stores all data locally
- Uses a unified reminder engine
- Supports light and dark mode
- Includes a hidden debug logging panel

---

# 2. Technology Stack

## 2.1 Platform

- Chrome Extension
- Manifest V3
- Background Service Worker

## 2.2 APIs Used

- `chrome.storage.local`
- `chrome.alarms`
- `chrome.notifications`
- `chrome.runtime`

No host permissions.
No external APIs.
No cloud services.

---

# 3. Architecture

## 3.1 High-Level Structure

```

Popup (UI Layer)
↓
Shared Storage Layer
↓
Reminder Engine (Background Service Worker)
↓
Chrome Alarms API
↓
Notification System

```

---

## 3.2 Layer Responsibilities

### Popup Layer

- Renders UI
- Reads/writes storage
- Does NOT manage alarms
- Does NOT contain business logic

### Background Service Worker

- Reminder engine
- Alarm scheduling
- Notification dispatch
- Focus suppression logic
- Midnight reset logic
- Logging

### Shared Layer

- Storage abstraction
- Constants
- Utility functions
- Logger module

---

# 4. Reminder Engine

## 4.1 Engine Type

Unified reminder engine.

All reminder types use the same scheduling and trigger handler.

Reminder-specific behavior is controlled via metadata.

---

## 4.2 Reminder Types

Supported:

- Water
- Posture
- Break
- Eye Rest
- Stand
- Stretch
- Breathing
- Work Start
- Work Lunch
- Work End

Maximum reminders allowed: 10

---

## 4.3 Reminder Object Model

Each reminder follows:

```json
{
  "id": "water",
  "enabled": true,
  "type": "interval" | "fixedTime",
  "intervalMinutes": 60,
  "timeOfDay": "09:00",
  "metadata": {},
  "lastTriggered": null
}
```

Minimum interval: 5 minutes
Invalid values are auto-corrected.

---

## 4.4 Alarm Lifecycle

### Creation

- Created when reminder enabled
- Deleted when reminder disabled
- Recreated on startup

### Trigger

- Alarm fires
- Engine checks:
  - Enabled status
  - Focus mode

- If valid → dispatch notification

### Restart Handling

On extension startup:

- Reload storage
- Recreate all alarms
- Perform missed midnight reset if needed

---

# 5. Time Handling

## 5.1 Internal Storage

- Store timestamps in UTC
- Display using user locale

## 5.2 Timezone

- Default: system timezone
- Manual override supported
- Timezone setting stored in settings

## 5.3 Daily Reset

- Triggered at local midnight
- If browser was closed → reset on next startup
- Applies to:
  - Water stats
  - Posture stats
  - Other daily counters

---

# 6. Focus Mode

## 6.1 Behavior

- Suppresses reminders
- Does NOT queue missed reminders
- Stores `focusUntil` timestamp

## 6.2 Persistence

- Persists across restart
- Checked before dispatching notification

---

# 7. Notification System

## 7.1 Notification Content

- Short
- Direct
- No motivational language

## 7.2 Buttons

Example:

- Log
- Snooze

## 7.3 Behavior

- Clicking body does nothing
- Button actions update storage only
- Auto-dismiss after 5 minutes
- Timeout value configurable constant

## 7.4 Sound

- Enabled by default
- Optional per reminder
- Controlled via metadata

---

# 8. Storage Strategy

## 8.1 Root Storage Key

Single root object:

```
rhythmData
```

Structure:

```json
{
  "schemaVersion": 1,
  "settings": {},
  "reminders": {},
  "stats": {},
  "notes": [],
  "logs": []
}
```

---

## 8.2 Schema Versioning

- `schemaVersion` required
- Migration scaffold included
- Migration executed on startup if version mismatch

---

# 9. Notes System

## 9.1 Structure

```json
{
  "id": "note-1",
  "text": "Finish report",
  "completed": false,
  "createdAt": 1700000000
}
```

## 9.2 Rules

- Max notes: 50
- Completed notes remain visible
- Completed notes sorted at bottom
- No auto-delete

---

# 10. Logging System

## 10.1 Logging Methods

- `logInfo()`
- `logWarn()`
- `logError()`

## 10.2 Persistence

- Logs stored in storage
- Persist across restart
- Circular buffer (recommended cap: 100 entries)

## 10.3 Debug Panel

- Hidden trigger in popup
- Displays logs
- Dev tool for testing

---

# 11. Validation Rules

- Minimum interval: 5 minutes
- Invalid values auto-corrected
- Max reminders: 10
- Max notes: 50

---

# 12. Performance Requirements

- Popup load time < 300ms
- No external libraries
- No runtime CSS injection
- No unnecessary reflows
- No polling loops
- Event-driven only

---

# 13. Security & Privacy

- No external API calls
- No user tracking
- No analytics
- No remote fonts
- Fully offline operation
- Minimal permissions

---

# 14. Accessibility

- WCAG AA contrast
- Keyboard navigation
- Minimum 40px touch targets
- No information conveyed by color alone

---

# 15. Offline Guarantee

- Works without internet
- Uses system font stack
- No CDN dependencies
- No remote assets

---

# 16. Future Extensibility

The unified reminder engine allows:

- Adding new reminder types
- Adding additional metadata
- Enabling advanced scheduling
- Adding analytics layer later
- Optional sync support in future versions

Schema versioning ensures safe migrations.

---

# 17. Known Constraints

- Alarms only fire when Chrome is running
- Service worker may sleep between events
- Notifications rely on OS support
