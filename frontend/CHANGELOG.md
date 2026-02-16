# CHANGELOG.md

## [Unreleased]

- test: make studio root access e2e use local baseURL
- test: add data-testid hooks for MCQ answer buttons
- test: add data-testid hooks for area selection and quiz start

## [1.4.7] - 2026-02-03

- tech: move from /uned/studio to /studio path throughout the codebase and infra
- feat: remove references to uned from code and presentation

## [1.4.6] - 2026-01-31

- feat: integrate /uned/studio/login page with Google OAuth (Cognito) and guest login options
- feat: add Cognito User Pool, Google IdP, and SPA client to infra (CDK)
- feat: Lambda@Edge handler validates Cognito JWTs (including Google federated users)

## [1.4.5] - 2026-01-28

- feat: add Google user switching capability after logout
- feat: add support for Google OAuth login/logout functionality
- feat: allows anonymous users to log in
- feat: display user's full name from Google OAuth in logout button
- fix: Implement correct answer display in status grid for MCQs
- fix: Shows error message if area file cannot be loaded
- tech: consolidate keys in local storage to a single object, unedStudio, for better management

## [1.4.4] - 2026-01-22

- ui: move Options button to a cogwheel menu to improve mobile layout (FEAT-007)
- test: improve testing logic using data-testid for result text (FEAT-007)
- ui: status grid overlay now covers the full screen and uses a semi-transparent background (BUG-006)

## [1.4.3] - 2026-01-21

- fix: answer shuffling now works between runs and is stable within a run (BUG-006)
- ui: make question/answer order toggles visually and logically consistent

## [1.4.2] - 2026-01-20

- fix: ensure section order in status grid matches section selection (BUG-004)
- bug: fix answer shuffling logic to ensure proper randomization on each attempt
- feat: add option to shuffle answers in Multiple Choice (toggle per area)
- feat: only show question order toggle for Multiple Choice areas
- feat: show 'Aparece en' always at the end (question and answer)
- ui: reduce visual prominence of 'Aparece en' and its list (smaller, gray text)
- ui: display failed-question explanation overlay above the status grid
- feat: support variable number of MCQ answers (2-5)
- feat: add test data infrastructure for E2E testing

## [1.4.1] - 2026-01-17

- feat: add numeric keyboard shortcuts for MCQ answers (1/2/3…)
- bug: fix sequential order skipping first question in section
- docs: add Conventional Commits and changelog process to AGENT_PLAN.md
- docs: explain release identification and independent data/code evolution

## [1.4.0] - 2026-01-14

- fix: always start at first question when starting sections or question selection
- test: add failing test for sequential order skipping first question in section
