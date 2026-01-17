# Bug: Sequential Order Skips First Question in Section

## Summary
When starting a quiz section in sequential order, the first question of the section is sometimes not shown first. Instead, the quiz may start at a later question, but subsequent questions are presented in order.

## Symptoms
- User selects a section and starts the quiz in sequential order.
- The first question in the section is not shown; the quiz starts at a later question.
- All following questions are shown in the correct order.

## Suspected Cause
- The application restores the previous current question index from localStorage (`currentQuestion_${areaKey}`) when starting a new section or quiz mode.
- If the saved index is not 0, the quiz may start at a later question, even if the question set has changed.
- This can happen if the user previously started a quiz in that area/section and did not reset or clear progress.

## Implementation Notes
- Ensure that when starting a new section or quiz mode, the current question index is always reset to 0 (the first question in the filtered/sorted list).
- Consider clearing or resetting `currentQuestion_${areaKey}` when the user starts a new section or changes the question set.
- Add or update tests to verify that the first question is always shown first in sequential order, regardless of previous progress.

## Next Steps
- Reproduce the bug with a failing test.
- Implement a fix to always reset the current question index when starting a new section or quiz mode.
- Verify with tests and user feedback.

# Agent Development Plan

## Features To Implement

- [ ] Feature. Responses to questions in Multiple Choice can use the keyboard for (1, 2, 3...) a part of using A, B, C, ... MINOR
- [ ] Bug. 16/01/2025. Esteve. In the contents of Introducción al pensamiento científico, ipc, it seems that in the section for exam for 2024 there are duplicated questions. It seems there are 20 and there should be 10. It also seems that in 2025 February 2, there are only 9 instead of 10. PATCH
- [ ] Bug. 16/01/2025. Tot i que he marcat l’opció seqüencial, la primera pregunta de cada secció no sempre es la pregunta 1. De vegades comença amb una altra, i a partir d’aquí va seqüencial. Bug: Sequential Order Skips First Question in Section. PATCH
- [ ] Technical. Question files use hyphen instead of underscore in filenames. Standardize to underscores for consistency. PATCH
- [ ] For Multiple Choice questions, there could be an arbitrary number of possible answers, not only 3. If there are 2, show only A and B. If there are 4, show A, B, C and D. If more options, increase the number of letters accordingly. PATCH
- [ ] In localStorage we are storing currentArea, quizStatus_[ByArea], questionOrder_[ByArea] and currentQuestion_[ByArea]. Consider storing all quiz related data under a single key "unedTestsData" to avoid cluttering localStorage with multiple keys. PATCH
- [ ] Application does not work on uned/studio without a trailing slash. Fix routing to work with and without trailing slash. humblyproud.com/uned/studio does not work without final slash. humblyproud.com/uned/studio/ works. Possibly an AWS problem.
- [ ] For Multiple Choice questions, the possible answers should be shown in random order each time the question is presented. The correct answer must be adjusted accordingly. Consider adding optionality in the menu to shuffle answers or not. MINOR

## Feature Implementation Workflow

1. **Branching:**
	- Before starting a new feature, create a branch named `feature/short-description` from `main`.

2. **Test-Driven Development (TDD):**
	- Always write a breaking test before implementing a new feature.
	- Use the Red-Green-Refactor cycle:
	  - Red: Write a failing (breaking) test. Once the test is written and is failing with the right logic, commit the test code with a descriptive message.
	  - Green: Implement the minimum code to make the test pass.
	  - Refactor: Clean up the code and tests. In this step, update AGENT_PLAN.md to reflect progress, remove completed items, and add new items as needed.
	- After the step is finished, commit the changes with a descriptive message.
	- Tests can be implemented using Playwright E2E tests or unit tests as appropriate.

3. **Running E2E Tests:**
	- For E2E tests, if you have to run them manually, run Playwright tests with `--reporter=list` for clear output and easier cancellation. Run them with chromium for faster feedback.
	- Example: `npx playwright test tests/area-navigation.spec.ts --project=chromium --reporter=list`
	- If a test run hangs, use Ctrl+C to cancel, then re-run with the correct reporter flag.

4. **Passing All Tests:**
	- Make all tests pass: Review and fix all failing Playwright E2E tests. Update code or tests as needed until all tests pass.

5. **Feature Completion:**
	- Once the feature is done and all the tests pass, update AGENT_PLAN.md to delete the feature.

6. **Versioning:**
	- Update the version in package.json according to the word at the end of the feature description:
	  - If it is PATCH, increment the patch version (e.g. 1.3.3 → 1.3.4).
	  - If it is MINOR, increment the minor version (e.g. 1.3.3 → 1.4.0).
	  - If it is MAJOR, increment the major version (e.g. 1.3.3 → 2.0.0).
	  - If none of these words appear, do not change the version.
	- If there is a version change, also update version-history.tsx.

7. **Committing and Merging:**
	- Commit the changes to the repository branch with a clear, descriptive commit message summarizing the feature or fix.
	- **If there is a version change,** start the commit message with the new version number (e.g. `v1.4.0:`) followed by a brief description. This makes version bumps easy to spot in the commit history, following common open source practice.
	- After completing a feature, create a pull request to the `main` branch for code review and merging (do not use GitKraken; use GitHub or the command line).
	- When the agent reaches the merge step, it must provide the user with clear, step-by-step instructions for merging the pull request in GitHub, including:
	  1. Pushing the feature branch to GitHub if not already done.
	  2. Navigating to the repository on GitHub (provide the direct link).
	  3. Clicking "Compare & pull request" for the feature branch.
	  4. Suggesting a concise, conventional title for the PR (e.g. `feat: add appearsIn field to questions (MINOR)`).
	  5. Suggesting a description summarizing the changes, tests, and any version bump (e.g. "Add 'appearsIn' field to questions JSON for better maintainability. Updated related UI and tests. All tests pass. Version bumped to v1.4.0.").
	  6. Instructing the user to submit the pull request.
	  7. Instructing the user to click "Merge pull request" after review.
	  8. Instructing the user to switch to main locally, pull, and delete the feature branch:
		  - `git checkout main`
		  - `git pull`
		  - `git branch -d <feature-branch-name>`
	  9. Instructing the user to delete the remote branch on GitHub (button or `git push origin --delete <feature-branch-name>`).
	- Once merged, switch your local branch to `main` and delete the merged feature branch locally and remotely.
