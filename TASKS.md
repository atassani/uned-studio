# TASKS

Lightweight backlog for this repo (we keep it in the repo instead of GitHub Issues).

## How we use this file

- New ideas/bugs go into **Backlog** (with date + reporter).
- When we commit to doing something, move it to **Now** and set a priority.
- When finished, move it to **Done** (don’t delete it). Add PR/commit link or hash + completion date.
- AI agents: pick the **first item in “Now”** (top to bottom). If “Now” is empty, pick the first **P1** item in Backlog.

## Last number

- FEAT: 9
- BUG: 6
- TECH: 7

---

## Now

### FEAT-007 — Move options out to a cogwheel menu

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-22
- **Reporter:** TT
- **Notes:** To simplify the buttons and make them fit in mobile for MCQ questions, move the Options button in the questions and answers page to a cogwheel menu in the top-right corner.

### BUG-006 — The greyed area behind the modal does not cover the full screen on desktop

- **Status:** backlog
- **Priority:** P2
- **Reported:** 2025-01-22
- **Reporter:** TT
- **Notes:**

---

## Backlog

### TEMPLATE

- **Status:** backlog
- **Priority:** [P1/P2/P3]
- **Reported:** YYYY-MM-DD
- **Reporter:** TT
- **Notes:**

### FEAT-008 — Make the questions directly clickable in MCQ quiz mode, instead of adding buttons

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-22
- **Reporter:** TT
- **Notes:**

### FEAT-009 — Make the Answer page integrated to the question page, instead of a separate page, for True/False and MCQ modes

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-22
- **Reporter:** TT
- **Notes:**

### BUG-005 — When working on T/F and sequential, after interrupting with options, when resuming it goes to a random question

- **Status:** backlog
- **Priority:** P1
- **Reported:** 2025-01-20
- **Reporter:** TT
- **Notes:** It may happen in MCQ.

### FEAT-004 — Show the question in the grid when clicking

- **Status:** Backlog
- **Priority:** P3
- **Reported:** 2025-01-19
- **Notes:** When the status grid is shown, at the end of que quiz or when reviewing, clicking a question box should show that question immediately as information, not to answer it. If the question has been answered, it will also show the valid answer. In particular, I want to see in the final page after the test, when reviewing solutions, the question I got wrong, and go to their detail.

### TECH-002 — Consolidate localStorage keys under a single root key

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-16
- **Reporter:** TT
- **Notes:** Today we store `currentArea`, `quizStatus_*`, `questionOrder_*`, `currentQuestion_*`. Consider one `unedTestsData` object.

### TECH-004 — Move E2E tests to unit tests where possible

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-20
- **Reporter:** TT
- **Notes:** It will speed up the test suite and make it less flaky. I am thinking, for instance, about sorting.

### TECH-005 — Standardize ESLint, Prettier, and TypeCheck with VSCode settings

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-20
- **Reporter:** TT
- **Notes:** It will prevent a noisy VSCode or surprises when running prettier.

### TECH-006 — Instruct in AGENTS how to work with TASKS.md

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-20
- **Reporter:** TT
- **Notes:** Will prevent mistakes and make it easier for agents to contribute. And not making a mess with the file.

### TECH-007 — Decide what to add to finished Tasks, PR, branch, commit…

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-20
- **Reporter:** TT
- **Notes:** To document done features and to be able to track and revert, we need to record when things were done. But what is the best way? PR link, branch name, commit hash…?

### TECH-003 — Separate application from data

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-17
- **Reporter:** TT
- **Notes:** Find a solution to separate app code from question data (e.g., JSON files). This would allow updating questions without redeploying the app.

### BUG-001 — Trailing slash required for /uned/studio route

- **Status:** backlog
- **Priority:** P1
- **Reported:** 2025-01-16
- **Reporter:** TT
- **Notes:** `/uned/studio` fails without trailing slash, but `/uned/studio/` works. Might be AWS/S3/CloudFront routing or Vercel rewrites.

### FEAT-006 — Sections in Section selection can have sub-sections, so I can click all exams, for instance, and see all their sections inside

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-20
- **Reporter:** TT
- **Notes:** The could be named like "Section top name > Sub-section name", and clicking the top name would expand/collapse the list of sub-sections.

---

## Done

### ✅ BUG-006 — Options are always in the same order, even with shuffle enabled

- **Status:** done
- **Priority:** P1
- **Reported:** 2025-01-21
- **Completed:** 2026-01-21
- **Reporter:** TT
- **PR:** [fix: answer shuffling now works between runs and is stable within a run (BUG-006) #14](https://github.com/atassani/uned-studio/pull/14)
- **Completed:** 2026-01-21
- **Notes:** Fixed answer shuffling logic and made toggles consistent. See E2E test bug-option-order.spec.ts.

### ✅ BUG-004 — Sections in the grid should always be listed in the same order, the same one used when offering sections to choose from: the one in the file

- **Status:** done
- **Priority:** P1
- **Reported:** 2025-01-20
- **Completed:** 2026-01-20
- **Reporter:** TT
- **PR:** [fix: ensure section order in status grid matches section selection (BUG-004) #12](https://github.com/atassani/uned-studio/pull/12)
- **Notes:** Fixed by passing the original section order from QuizApp to StatusGrid and sorting sections accordingly. See changelog and E2E test.

### ✅ BUG-003 — Shuffle does not work and repeats same order

- **Status:** backlog
- **Priority:** P3
- **Reported:** 2025-01-18
- **Completed:** 2026-01-19
- **Reporter:** TT
- **Notes:** Modularised code. Fixed shuffling logic to properly randomize answer order on each attempt.

### ✅ FEAT-003 — Shuffle multiple-choice answer order

- **Status:** done
- **Priority:** P3
- **Reported:** 2025-01-16
- **Completed:** 2026-01-18
- **Notes:** Randomize options each time; adjust correct answer accordingly; add setting to enable/disable. Also: 'Aparece en' always at the end, only show order toggle for MCQ, and UI improvements for 'Aparece en'.
  - See: [CHANGELOG.md]

### ✅ FEAT-002 — Support variable number of answers in multiple choice (2..5)

- **Status:** done
- **Priority:** P2
- **Reported:** 2025-01-16
- **Completed:** 2026-01-18
- **Commits:**
  - RED: E2E test for MCQ variable options (mcq-variable-options.spec.ts)
  - GREEN: Test data infrastructure and custom areas file support
- **Notes:** Added support for MCQ questions with 2-5 answer options (not just 3). Created test data infrastructure to keep test-only data separate from production. Added environment variable support for custom areas.json file.

### ✅ BUG-002 — Duplicated / missing questions in IPC exam sections

- **Status:** backlog
- **Priority:** P1
- **Reported:** 2025-01-16
- **Completed:** 2026-01-17
- **Reporter:** Esteve
- **Area:** IPC contents
- **Notes:** In 2024 exam section there seem to be 20 questions (expected 10). In 2025 Feb model 2 there are 9 (expected 10).

### ✅ FEAT-001 — Keyboard shortcuts for multiple-choice (1/2/3…)

- **Status:** done
- **Priority:** P3
- **Reported:** 2025-01-16
- **Completed:** 2026-01-17
- **Commits:**
  - RED: Playwright E2E test (mcq-numeric-shortcuts.spec.ts)
  - GREEN: QuizApp.tsx implementation
- **PR:** [https://github.com/atassani/uned-studio/pull/8](https://github.com/atassani/uned-studio/pull/8)
- **Reporter:** TT
- **Notes:** Numeric keys now select MCQ answers (1 = A, 2 = B, etc.) in addition to A/B/C. Improves accessibility and speed for keyboard users.
  - Tried to use Enter and Space to confirm answers, but they are used by default when a button is selected, so it conflicted.

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
