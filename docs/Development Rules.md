# Rhythm – Developer Governance & Rules

Version: 1.0

This document defines strict development discipline rules.  
These rules must be followed for every change.

No exceptions.

---

# 1. Branching Rules

## 1.1 Main Branch Protection

- Direct commits to `main` are strictly prohibited.
- All changes must go through a Pull Request (PR).
- `main` must always remain stable and production-ready.

---

## 1.2 Branch Creation

All work must start from latest `main`.

Required steps:

1. Checkout main:

```

git checkout main
git pull origin main

```

2. Create branch:

```

git checkout -b feature/<name>

```

Branch naming rules:

Feature:

```

feature/<short-description>

```

Fix:

```

fix/<short-description>

```

Refactor:

```

refactor/<short-description>

```

Docs:

```

docs/<short-description>

```

---

# 2. Commit Rules

## 2.1 Commit Format (Mandatory)

Every commit must follow:

```

<type>: <short summary>

Reason: <why this change is required>

Details: <what was changed>

Impact: <which areas are affected>

```

Allowed types:

- feat
- fix
- refactor
- docs
- test
- chore

---

## 2.2 Forbidden Commit Messages

These are not allowed:

- "update"
- "changes"
- "fix stuff"
- "minor fixes"
- "misc"
- "cleanup"
- "final"

Each commit must clearly explain intent.

---

## 2.3 Commit Discipline

- One logical change per commit.
- No mixing feature + refactor in same commit.
- No unrelated fixes in same commit.
- No commented-out code committed.
- No TODO left in production branch.

---

# 3. Pull Request Rules

## 3.1 PR Size Limit

- Max 300 lines changed per PR.
- One feature or one fix per PR.
- Large refactors must be broken into multiple PRs.

---

## 3.2 Mandatory PR Description Template

Every PR must include:

### What was changed?

Clear explanation.

### Why was it needed?

Problem statement.

### How was it implemented?

Technical summary.

### What was tested?

List specific test cases executed.

### Risk Level:

Low / Medium / High

---

## 3.3 Mandatory PR Checklist

Every PR must confirm:

- [ ] All related test cases passed
- [ ] Restart tested
- [ ] Extension disable/re-enable tested
- [ ] No console errors
- [ ] No console.log left
- [ ] No hardcoded values
- [ ] No direct alarm logic in popup
- [ ] No duplicate alarm creation
- [ ] Midnight reset verified (if related)

PR cannot be merged unless all are checked.

---

# 4. Definition of Ready (Before Development Starts)

A task is ready only if:

- Acceptance criteria are defined.
- Related test cases are identified.
- Scope boundaries are clear.
- Edge cases are listed.
- Schema impact identified (if any).

If these are missing → do not start coding.

---

# 5. Definition of Done (Before Merge)

A change is complete only if:

- All relevant test cases pass.
- Restart scenario tested.
- Disable/re-enable tested.
- No console errors.
- No duplicate alarms.
- No data corruption.
- Logs reflect correct state transitions.
- Documentation updated if behavior changed.

---

# 6. Logging Discipline

Every critical state change must be logged:

Must log:

- Alarm creation
- Alarm deletion
- Snooze creation
- Reminder suppression
- Midnight reset
- Focus start
- Focus end

Why:
Scheduling bugs are invisible without logs.

---

# 7. Scheduling Safety Rules

- Never use setInterval for reminders.
- Only use chrome.alarms.
- Never create alarms from popup UI.
- Always check if alarm already exists before creating.
- Always cancel alarm before recreating.

Failure to follow this causes duplication bugs.

---

# 8. Schema Protection Rules

- Do not modify schema without updating:
  - schemaVersion
  - migration logic
  - documentation

- Never partially update storage.
- Always write complete object updates.
- Always validate structure before use.

---

# 9. Bug Severity Classification

Critical:

- Alarm duplication
- Missed midnight reset
- Crash
- Data loss
- Corrupted storage

Major:

- Reminder not firing
- Focus not suppressing
- Schedule incorrect

Minor:

- UI misalignment
- Animation glitch

Trivial:

- Text typo

Critical bugs must be fixed immediately using hotfix branch.

---

# 10. Hotfix Protocol

If critical bug found:

1. Create:

```

fix/hotfix-<issue>

```

2. Fix only that issue.
3. Raise PR.
4. Merge after review.
5. Increment PATCH version.
6. Tag release.

---

# 11. Code Freeze Rule

Before public release:

- No new features.
- Only bug fixes.
- No refactors.
- No style changes.
- No UI tweaks.

Stability first.

---

# 12. Version Tag Discipline

After stable milestone:

```

git tag vX.X.X
git push origin vX.X.X

```

Stable states must be tagged.

---

# 13. No Guesswork Rule

Developer must not:

- Invent new architecture.
- Modify reminder lifecycle.
- Add features outside PRD.
- Change schema without approval.
- Modify alarm behavior without updating test cases.

If unclear → ask before coding.

---

# 14. Release Validation

Before Store upload:

- All test cases pass.
- No console errors.
- No duplicate alarms.
- Restart tested.
- Focus tested.
- Midnight reset tested.
- JSON export tested.
- Reset data tested.

Only after full validation is release allowed.

---

# 15. Weekly Hygiene (If Solo Developer)

Once per week:

- Review merged commits.
- Confirm no orphan branches.
- Verify version tags.
- Confirm documentation updated.

---

# Final Rule

Process discipline prevents production disasters.

Skipping process leads to:

- Duplicate alarms
- Missed resets
- Silent failures
- User distrust

Rules exist to prevent hidden instability.

All developers must follow this document strictly.

---
