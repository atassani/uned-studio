
# Agent Development Plan

## Features To Implement

- [x] LocalStorage is not deleted on iPhone when using the option to Empezar de nuevo. Validate in iPhone and iPad. LocalStorage is not cleared with Volver a empezar in iPhone. Test and fix it. PATCH
- [ ] Add 'appearsIn' field to questions_ipc.json: Only questions in questions_ipc.json should have an appearsIn array, which lists valid section or exam names where the question appears. Section/exam references are parsed from the end of the explanation and moved to appearsIn, and the explanation is cleaned. The UI must display appearsIn as a bullet list after the explanation, if present. A test must ensure all appearsIn values are valid and only present in questions_ipc.json. MINOR
- [ ] Application does not work on uned/studio without a trailing slash. Fix routing to work with and without trailing slash. humblyproud.com/uned/studio does not work without final slash. humblyproud.com/uned/studio/ works. Possibly an AWS problem.
- [ ] For Multiple Choice questions, there could be an arbitrary number of possible answers, not only 3. If there are 2, show only A and B. If there are 4, show A, B, C and D. If more options, increase the number of letters accordingly. PATCH
- [ ] For Multiple Choice questions, the possible answers should be shown in random order each time the question is presented. The correct answer must be adjusted accordingly. Consider adding optionality in the menu to shuffle answers or not. MINOR
- [ ] In localStorage we are storing currentArea, quizStatus_[ByArea], questionOrder_[ByArea] and currentQuestion_[ByArea]. Consider storing all quiz related data under a single key "unedTestsData" to avoid cluttering localStorage with multiple keys. PATCH

## Feature Implementation Workflow

1. **Branching:**
	- Before starting a new feature, create a branch named `feature/short-description` from `main`.

2. **Test-Driven Development (TDD):**
	- Always write a breaking test before implementing a new feature.
	- Use the Red-Green-Refactor cycle:
	  - Red: Write a failing (breaking) test. Once the test is written and is failing with the right logic, commit the test code with a descriptive message.
	  - Green: Implement the minimum code to make the test pass.
	  - Refactor: Clean up the code and tests. In this step, update AGENT_PLAN.md to reflect progress, tick off completed items, and add new items as needed.
	- After the step is finished, commit the changes with a descriptive message.
	- Tests can be implemented using Playwright E2E tests or unit tests as appropriate.

3. **Running E2E Tests:**
	- For E2E tests, if you have to run them manually, run Playwright tests with `--reporter=list` for clear output and easier cancellation. Run them with chromium for faster feedback.
	- Example: `npx playwright test tests/area-navigation.spec.ts --project=chromium --reporter=list`
	- If a test run hangs, use Ctrl+C to cancel, then re-run with the correct reporter flag.

4. **Passing All Tests:**
	- Make all tests pass: Review and fix all failing Playwright E2E tests. Update code or tests as needed until all tests pass.

5. **Feature Completion:**
	- Once the feature is done and all the tests pass, update AGENT_PLAN.md to tick the box of the feature.

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
