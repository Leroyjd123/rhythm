# Rhythm — Wellbeing & Schedule Reminders

> A lightweight, offline-first Chrome extension that helps you stay hydrated, move regularly, and respect your work schedule — without getting in your way.

![Version](https://img.shields.io/badge/version-1.0.1-blue)
![Manifest](https://img.shields.io/badge/manifest-v3-green)
![Chrome](https://img.shields.io/badge/chrome-%3E%3D120-orange)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## What it does

Rhythm runs quietly in the background and nudges you at the right moments — drink water, fix your posture, rest your eyes, take a break. It also tracks your work schedule so you never lose track of your day.

Everything is stored locally on your device. No accounts, no cloud, no tracking.

---

## Features

### Wellbeing Reminders
| Reminder | Default Interval | What it does |
|---|---|---|
| 💧 Water | 15 min | Reminds you to drink water, tracks daily glasses (target: 8) |
| 🧘 Posture | 30 min | Prompts a posture check |
| ☕ Break | 60 min | Encourages a short screen break |
| 👁️ Eye Rest | 20 min | Follows the 20-20-20 rule |
| 🚶 Stand | 45 min | Reminds you to stand up |
| 🙆 Stretch | 60 min | Prompts a quick stretch |
| ✨ Breathing | 90 min | Mindful breathing reminder |

### Work Schedule
Fixed-time reminders with customisable time and workday selection:
- 🕒 **Work Start** — start your day intentionally
- 🍎 **Lunch** — step away from the screen
- 🌙 **Work End** — switch off and wind down

### Focus Mode
One-click 1-hour focus session that suppresses all reminders. A notification fires when the session ends so you know reminders have resumed.

### Quick Notes
A lightweight scratchpad inside the popup — jot down tasks, ideas, or anything you need to remember. Notes auto-save and support completion (with strikethrough) and deletion.

### Settings
- **Master Toggle** — disable all reminders globally without losing your configuration
- **Dark Mode** — persisted across sessions
- **Sound** — optional chime when a reminder fires
- **Export JSON** — back up all your data at any time
- **Reset Data** — start fresh

---

## Installation

### From Chrome Web Store
*(Coming soon)*

### Developer Mode (local)
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the root folder of this project
5. The Rhythm icon will appear in your toolbar

To pick up code changes after editing files, click the **↺ reload** button on the extension card in `chrome://extensions`.

---

## Project Structure

```
rhythm/
├── manifest.json               # Extension manifest (MV3)
├── icon128.png                 # Extension icon
├── src/
│   ├── popup/
│   │   ├── popup.html          # Popup UI
│   │   ├── popup.css           # Popup styles
│   │   └── popup.js            # Popup logic
│   ├── background/
│   │   ├── service-worker.js   # MV3 service worker
│   │   ├── reminder-engine.js  # Alarm scheduling & notifications
│   │   └── audio.js            # Offscreen audio manager
│   ├── offscreen/
│   │   ├── offscreen.html      # Offscreen document host
│   │   └── offscreen.js        # Web Audio API chime player
│   ├── shared/
│   │   ├── storage.js          # Storage schema & helpers
│   │   └── logger.js           # Lightweight logger
│   └── styles/
│       └── tokens.css          # CSS design token system (light + dark)
├── scripts/
│   └── sync-version.js         # Keeps manifest.json version in sync with package.json
└── tests/
    ├── setup/
    │   └── chrome-mock.js      # Chrome API shims for unit tests
    ├── storage.test.js
    └── reminder-engine.test.js
```

---

## Development

### Prerequisites
- Node.js 18+
- Chrome 120+

### Install dev dependencies
```bash
npm install
```

### Run tests
```bash
npm test          # run once
npm run test:watch  # watch mode
```

### Bump the version
The version in `manifest.json` is kept in sync with `package.json` automatically:

```bash
npm run version:patch   # 1.0.1 → 1.0.2
npm run version:minor   # 1.0.1 → 1.1.0
npm run version:major   # 1.0.1 → 2.0.0
```

This updates both files and stages `manifest.json` for the version commit.

---

## Tech Stack

- **Chrome Extension Manifest V3**
- **Vanilla JavaScript (ES Modules)**
- **Vanilla CSS with Design Tokens** — light + dark themes via `[data-theme="dark"]`
- **Chrome APIs**: `storage`, `alarms`, `notifications`, `offscreen`
- **Web Audio API** (via offscreen document) for notification chimes
- **Vitest** for unit testing

---

## Privacy

Rhythm collects no user data. All settings, reminder state, stats, and notes are stored exclusively in `chrome.storage.local` on your device and never transmitted anywhere.

See [Privacy Policy](https://leroyjd123.github.io/rhythm/privacy) for the full statement.

---

## Support the Project

If Rhythm helps you feel better at your desk, consider buying me a coffee:

[❤ Support on PayPal](https://paypal.me/leroyjd)

---

## License

MIT © Leroy D'Souza
