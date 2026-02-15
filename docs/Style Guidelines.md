# Rhythm – Style Guidelines

Version: 1.0

---

This document defines the technical standards, UI system, and architectural conventions for the Rhythm Chrome Extension.

The purpose of these guidelines is to ensure:

- Consistency
- Maintainability
- Scalability
- Accessibility
- Lightweight performance
- Offline-first reliability

---

# 1. Code Style (JavaScript)

## 1.1 Formatting Rules

- **Indentation**: 2 spaces
- **Semicolons**: Required
- **Quotes**: Use single quotes (`'`) unless JSON requires double quotes
- **Trailing commas**: Use in multi-line objects/arrays
- **Max line length**: 100 characters (soft limit)

## 1.2 Naming Conventions

| Type      | Convention       | Example              |
| --------- | ---------------- | -------------------- |
| Variables | camelCase        | `intervalMinutes`    |
| Functions | camelCase        | `createReminder()`   |
| Classes   | PascalCase       | `ReminderEngine`     |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_INTERVAL`   |
| Files     | kebab-case.js    | `reminder-engine.js` |

## 1.3 Functions

- Prefer arrow functions for callbacks.
- Use named functions for exported logic.
- Keep functions under 40 lines when possible.
- Avoid deeply nested logic (max depth: 3 levels).

## 1.4 Logging

All logging must go through `logger.js`.

Allowed methods:

- `logInfo(message, data?)`
- `logWarn(message, data?)`
- `logError(message, error?)`

Do not use raw `console.log` outside the logger module.

---

# 2. Chrome Extension Standards

## 2.1 Manifest Version

- Must use Manifest V3.
- Background must use `service_worker`.

## 2.2 Permissions

Only allowed permissions:

- `storage`
- `alarms`
- `notifications`

No host permissions unless absolutely required.

## 2.3 Architecture Separation

| Layer      | Responsibility                  |
| ---------- | ------------------------------- |
| popup      | UI only                         |
| background | Reminder engine + notifications |
| shared     | Utilities, storage, constants   |
| styles     | Tokens and base styling         |

No business logic inside popup components.

---

# 3. Design System (Token-Based)

All UI values must be defined in `src/styles/tokens.css`.

No hardcoded color values in components.

---

# 3.1 Color Tokens

## Light Mode

```css
:root {
  --color-bg: #f6f7f5;
  --color-surface: #ecedeb;
  --color-surface-elevated: #ffffff;

  --color-text-primary: #2b2c2f;
  --color-text-muted: #6f7378;

  --color-accent: #7faf9b;
  --color-accent-soft: rgba(127, 175, 155, 0.12);

  --color-border-soft: rgba(0, 0, 0, 0.06);
}
```

## Dark Mode

```css
[data-theme="dark"] {
  --color-bg: #1e1f22;
  --color-surface: #2a2c31;
  --color-surface-elevated: #32343a;

  --color-text-primary: #e4e6eb;
  --color-text-muted: #9da1a8;

  --color-accent: #8fc3ac;
  --color-accent-soft: rgba(143, 195, 172, 0.18);

  --color-border-soft: rgba(255, 255, 255, 0.08);
}
```

Theme must be applied using:

```html
<html data-theme="light"></html>
```

Supported modes:

- `light`
- `dark`
- `system`

---

# 3.2 Spacing Tokens

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
```

No arbitrary spacing values allowed.

---

# 3.3 Radius Tokens

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
```

Cards must use `--radius-md`.

---

# 3.4 Shadow Tokens

Light mode:

```css
--shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.04);
```

Dark mode:

```css
--shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.3);
```

Heavy shadows are prohibited.

---

# 4. Typography System

Font stack:

```css
--font-primary:
  "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

Text scale:

```css
--text-title: 16px;
--text-body: 14px;
--text-small: 12px;
```

Weight usage:

- Title: 600
- Reminder Label: 500
- Secondary text: 400

No decorative fonts.

---

# 5. Layout System

## Popup Dimensions

- Min width: 320px
- Max width: 360px
- Vertical scrolling allowed
- Padding: `var(--space-4)`

## Grouped Sections

Structure:

```
Section Title
Card List
```

Allowed sections:

- Health
- Movement
- Work
- Notes

Section Title:

- Font size: 12px
- Weight: 600
- Color: `--color-text-muted`

---

# 6. Reminder Card Component

Structure:

```
.card
  .card-header
    .icon
    .label
    .counter
    .toggle
  .card-body (expandable)
```

Rules:

- Background: `--color-surface`
- Radius: `--radius-md`
- Shadow: `--shadow-soft`
- Padding: `var(--space-3)`
- Margin-bottom: `var(--space-3)`

Counters must be visible on the main screen.

Example:
`3 / 8`

---

# 7. Icon System

- SVG only
- 16–18px
- Stroke-based (no filled blocks)
- `stroke-width: 1.5–2`
- Use `currentColor`

No emoji.

---

# 8. Focus Mode Styling

When active:

- Banner at top
- Background: `--color-accent-soft`
- Left border: 3px solid `--color-accent`
- Bold small text
- Remaining time displayed

Reminder cards slightly reduced opacity (0.85).

---

# 9. Motion Standards

- Duration: 150–200ms
- Easing: ease-out
- Allowed:
  - Fade
  - Expand/collapse
  - Toggle slide

No bounce or elastic animations.

---

# 10. Accessibility

- WCAG AA contrast minimum
- Minimum clickable height: 40px
- Keyboard accessible:
  - Tab navigation
  - Enter activates
  - Space toggles switches

- No information conveyed by color alone

---

# 11. Performance Rules

- No unnecessary reflows
- No animation on large layout shifts
- Popup load time under 300ms
- No external CSS libraries
- No runtime CSS injection

---

# 12. Multilingual Constraints

- Avoid long sentences
- Prefer short labels
- Avoid grammar-dependent dynamic strings
- Numbers preferred over descriptive text

Example:
`4 / 8 glasses`
Not:
`You completed four of eight glasses today`

---

# 13. Git Conventions

## Commit Messages

Use imperative style:

- `Add water reminder toggle`
- `Fix dark mode contrast`
- `Refactor reminder engine`

## Branch Naming

- `feature/water-reminder`
- `fix/dark-mode-toggle`
- `refactor/storage-layer`

---

# 14. Prohibited Patterns

- Hardcoded colors
- Inline styling
- Global CSS overrides
- Deep nested selectors
- Unstructured event listeners
- Mixing UI and engine logic
