# TASKS

Lightweight backlog for this repo (we keep it in the repo instead of GitHub Issues).

## How we use this file
- New ideas/bugs go into **Backlog** (with date + reporter).
- When we commit to doing something, move it to **Now** and set a priority.
- When finished, move it to **Done** (don’t delete it). Add PR/commit link or hash + completion date.
- AI agents: pick the **first item in “Now”** (top to bottom). If “Now” is empty, pick the first **P1** item in Backlog.

---

## Now

### BUG-002 — Duplicated / missing questions in IPC exam sections
- **Status:** backlog
- **Priority:** P1
- **Reported:** 2025-01-16
- **Reporter:** Esteve
- **Area:** IPC contents
- **Notes:** In 2024 exam section there seem to be 20 questions (expected 10). In 2025 Feb model 2 there are 9 (expected 10).

---

## Backlog

### BUG-001 — Trailing slash required for /uned/studio route
- **Status:** backlog
- **Priority:** P1
- **Reported:** 2025-01-16
- **Reporter:** TT
- **Notes:** `/uned/studio` fails without trailing slash, but `/uned/studio/` works. Might be AWS/S3/CloudFront routing or Vercel rewrites.

### FEAT-003 — Shuffle multiple-choice answer order (optional)
- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-16
- **Reporter:** TT
- **Notes:** Randomize options each time; adjust correct answer accordingly; add setting to enable/disable.

### FEAT-002 — Support variable number of answers in multiple choice (2..N)
- **Status:** backlog
- **Priority:** P2
- **Reported:** 2025-01-16
- **Reporter:** TT
- **Notes:** Show A..N depending on options; don’t assume exactly 3.

### FEAT-001 — Keyboard shortcuts for multiple-choice (1/2/3…)
- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-16
- **Reporter:** TT
- **Notes:** Allow numeric keys to select answers, in addition to A/B/C.

### TECH-002 — Consolidate localStorage keys under a single root key
- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-16
- **Reporter:** TT
- **Notes:** Today we store `currentArea`, `quizStatus_*`, `questionOrder_*`, `currentQuestion_*`. Consider one `unedTestsData` object.

---

## Done

### ✅ BUG-000 — Sequential order skipped first question in section
- **Status:** done
- **Reported:** 2025-01-16
- **Reporter:** TT
- **Completed:** 2025-01-?? (commit `147473e`)
- **Summary:** Sequential mode sometimes started at a later question due to restoring `currentQuestion_*` from localStorage.
- **Fix:** Always reset current question to 0 when starting a section / selection; removed restore logic in `startQuizSections` and `startQuizQuestions`.
- **Test:** Added a regression test that sets localStorage to reproduce the failure; now passes.

---

## Notes for contributors

### Priority meanings
- **P1:** user-facing breakage / wrong data / blocks usage
- **P2:** important improvement, but workaround exists
- **P3:** nice-to-have / small UX / cleanup

### VS Code tips (to keep it “list-like”)
- Use the built-in folding:
  - **Fold all:** Cmd+K, Cmd+0 (Mac) / Ctrl+K, Ctrl+0 (Win/Linux)
  - **Unfold all:** Cmd+K, Cmd+J / Ctrl+K, Ctrl+J
  - **Fold level 1 (H1 only):** Cmd+K, Cmd+1 / Ctrl+K, Ctrl+1
- Use **Outline** view to navigate headings:
  - View → Open View… → **Outline**
- Use breadcrumbs for quick heading jumps:
  - View → Appearance → **Breadcrumbs**
- Extensions (optional):
  - **Markdown All in One** (better TOC, shortcuts, formatting)
  - **markdownlint** (keeps structure consistent)

### Rule of thumb for AI agents editing this file
- Don’t delete items when completed: move them to **Done**, add completion date + PR/commit.
- If you discover sub-tasks while implementing, add them under the same item as bullet notes (don’t explode the list).
