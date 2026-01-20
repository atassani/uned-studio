# CHANGELOG.md

## [Unreleased]

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
