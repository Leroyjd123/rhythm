# Rhythm – Chrome Extension

Rhythm is a lightweight, offline-first Chrome Extension (Manifest V3) designed for schedule discipline and physical wellbeing. It helps users maintain a healthy rhythm through structured reminders for hydration, movement, and work boundaries.

## Core Features

- **Unified Reminder Engine**: Intelligent background scheduling for all reminder types.
- **Wellbeing Reminders**: Stay on track with hydration (Water), posture, eye rest, and more.
- **Work Schedule**: Set specific times for work start, lunch, and work end with custom workday selectors.
- **Focus Mode**: A one-click global suppression system to block all notifications during deep work sessions.
- **Quick Notes**: A lightweight, auto-saving scratchpad for daily tasks and thoughts.
- **Advanced Control**: Master toggle, debug logs, and data export (JSON).

## Design Principles

1.  **Calm over Urgency**: Supportive notifications, not stressful ones.
2.  **Local-First**: No cloud sync, no accounts, 100% offline.
3.  **Privacy by Design**: No user data collection, no external APIs.
4.  **Minimalist**: A clean, premium UI that lives in your browser.

## Installation (Developer Mode)

1.  Download or clone this repository.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** in the top right corner.
4.  Click **Load unpacked** and select the root directory of this project.

## Technology Stack

- **Manifest V3**
- **JavaScript ES6+**
- **Vanilla CSS** (Design Token System)
- **Chrome APIs**: `storage`, `alarms`, `notifications`

## License

MIT
