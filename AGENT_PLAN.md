# Agent Implementation Plan: Multi-Area Quiz Support

## Action plan

- [ ] Fix test timeouts for firefox and webkit in Playwright tests. Currently, some tests are failing due to timeouts in these browsers. Investigate and resolve the underlying issues to ensure cross-browser compatibility.
- [ ] Create a small standalone script that validates that for multiple choice questions, the correct answer text is among the possible answers. This script can be run as part of a CI/CD pipeline to ensure question files are well formed before deployment. The files to check will be in areas.json.
- [ ] Package the application with webpack or similar for production deployment.
- [ ] Separate application from JSON data files for better organization and ease of maintenance.
- [ ] For Multiple Choice quesitions, there could be an arbitrary number of possible answers, not only 3. If there are 2, show only A and B. If there are 4, show A, B, C and D. If more options, increase the number of letters accordingly.
- [ ] For Multiple Choice questions, modify the json files so that they store the literal text of the correct answer, instead of the letter (A, B, C, D). This will make it easier to maintain the files, as shuffling the answers will not require updating the correct answer letter. 
- [ ] For Multiple Choice questions, the possible answers should be shown in random order each time the question is presented. The correct answer must be adjusted accordingly.
- [ ] In localStorage we are storing currentArea, quizStatus_[ByArea], questionOrder_[ByArea] and currentQuestion_[ByArea]. Consider storing all quiz related data under a single key "unedTestsData" to avoid cluttering localStorage with multiple keys.
- [ ] LocalStorage is not cleared with Volver a empezar in iPhone. Test and fix it.
- [ ] humblyproud.com/uned/tests does not work without final slash. humplyproud.com/uned/tests/ works.
- [ ] Add new JSON field for "appearsIn" containing an array of the sections (exams or topics) where the question appears. Currently it is only in IPC questions, as part of the text and it could be formatted in the JSON file, but it is more maintainable to have it as a separate field.

## Development Guidelines

- Apply TDD. Always write a breaking test before implementing a new feature. Use Red-Green-Refactor cycle. In the Refactor step, update AGENT_PLAN.md to reflect the progress, tick off completed items, and add new items as needed. After the step is finished, commit the changes with a descriptive message. Tests can be implemented using Playwright E2E tests or unit tests as appropriate.
- Always run Playwright tests with `--reporter=list` for clear output and easier cancellation.
- Set Playwright test timeout to 5 seconds for fast feedback. (See playwright.config.ts: `timeout: 3000`)
- Example: `npx playwright test tests/area-navigation.spec.ts --project=chromium --reporter=list`
- If a test run hangs, use Ctrl+C to cancel, then re-run with the correct reporter flag.
- Always add new feature suggestions to AGENT_PLAN before implementation
- Always write or update Playwright tests before implementing new features (TDD)
- Always update AGENT_PLAN after completing a feature or test
- Make all Playwright tests pass: Review and fix all failing Playwright E2E tests, focusing on area switching, persistence, and sequential order logic. Update code or tests as needed until all tests pass.
