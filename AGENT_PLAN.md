# Agent Development Plan

## Action plan

- [x] For Multiple Choice questions, modify the json files so that they store the literal text of the correct answer, instead of the letter (A, B, C, D). This will make it easier to maintain the files, as shuffling the answers will not require updating the correct answer letter.
- [ ] Package the application with webpack or similar for production deployment.
- [ ] Separate application from JSON data files for better organization and ease of maintenance.
- [ ] Add new JSON field for "appearsIn" containing an array of the sections (exams or topics) where the question appears. Currently it is only in IPC questions, as part of the text and it could be formatted in the JSON file, but it is more maintainable to have it as a separate field. MINOR
- [ ] LocalStorage is not deleted on iPhone when using the option to Empezar de nuevo. Validate in iPhone and iPad. LocalStorage is not cleared with Volver a empezar in iPhone. Test and fix it. MINOR
- [ ] Application does not work on uned/tests withouth a trailing slash. Fix routing to work with and without trailing slash. humblyproud.com/uned/tests does not work without final slash. humplyproud.com/uned/tests/ works.
- [ ] For Multiple Choice questions, there could be an arbitrary number of possible answers, not only 3. If there are 2, show only A and B. If there are 4, show A, B, C and D. If more options, increase the number of letters accordingly.
- [ ] For Multiple Choice questions, the possible answers should be shown in random order each time the question is presented. The correct answer must be adjusted accordingly. Consider adding optionality in the menu to shuffle answers or not.
- [ ] In localStorage we are storing currentArea, quizStatus_[ByArea], questionOrder_[ByArea] and currentQuestion_[ByArea]. Consider storing all quiz related data under a single key "unedTestsData" to avoid cluttering localStorage with multiple keys. MINOR

## Development Guidelines

### Feature Implementation Workflow

1. **Branching:**
   - Before starting a new feature, create a branch named `feature/short-description` from `main`.

2. **Test-Driven Development (TDD):**
   - Always write a breaking test before implementing a new feature.
   - Use the Red-Green-Refactor cycle:
     - Red: Write a failing (breaking) test.
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
   - **If there is a version change,** start the commit message with the new version number (e.g. `v1.4.0:`) followed by a brief description. This makes version bumps easy to spot in the commit history, following common practice in open source projects.
   - After completing a feature, create a pull request to the `main` branch for code review and merging.
   - Once merged, delete the feature branch to keep the repository clean.
