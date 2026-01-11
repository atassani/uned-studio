# Agent Implementation Plan: Multi-Area Quiz Support

## Phase 1: Project Familiarization
- [x] Create AGENT_PLAN.md
- [x] Inspect current QuizApp.tsx structure and question loading logic
- [x] Examine existing Playwright tests in tests/home.spec.ts
- [x] Review public/ directory and existing JSON files
- [x] Check version history page structure
- [x] Examine GitHub workflows for CI configuration

## Phase 2: Data Structure Setup
- [x] Create areas.json index file in public/
- [x] Rename public/questions.json to public/questions_logica1.json
- [x] Update any hardcoded references to questions.json
- [x] Verify questions_ipc.json structure matches expected format

## Phase 3: Core Logic Implementation
- [x] Design localStorage structure for multiple quiz progress tracking
- [x] Create types/interfaces for areas and different question types
- [x] Implement area selection UI ("¿Qué quieres estudiar?")
- [x] Add question type detection and routing logic
- [x] Implement multiple choice question display with options a, b, c
- [x] Add button and keyboard input handling for multiple choice (**COMPLETED**)

## Phase 4: State Management Updates
- [x] Refactor localStorage to support multiple areas (quizStatusByArea)
- [x] Update quiz progress tracking to work per area
- [x] Ensure resume functionality works across different areas
- [x] Test switching between areas without losing progress (**COMPLETED**)

## Phase 5: UI/UX Implementation
- [ ] Update feedback UI to work with both question types
- [ ] Ensure mobile responsiveness for new multiple choice interface
- [ ] Maintain existing True/False UI for backward compatibility
- [ ] Keep basePath support for static export

## Phase 6: Testing
- [x] Update existing Playwright tests for area selection flow
- [x] Add new Playwright test for Multiple Choice workflow
- [x] Add keyboard shortcuts tests for multi-area navigation (**ALL TESTS PASSING - 27/27**)

## Phase 7: UI/UX Consistency & Backward Compatibility (**NEW REQUIREMENTS**)
- [ ] **UI Consistency**: Change Multiple Choice display from option buttons to text + A/B/C buttons
  - [ ] Write failing test for MCQ text display format
  - [ ] Implement MCQ text display with A/B/C buttons at bottom
  - [ ] Ensure A/B/C buttons work correctly
- [ ] **Backward Compatibility**: Migrate existing localStorage data
  - [ ] Write test for localStorage migration from `quizStatus` to `quizStatus_questions_logica1`
  - [ ] Implement migration logic on app startup
  - [ ] Remove `.json` suffix from localStorage keys (use `quizStatus_questions_logica1` not `quizStatus_questions_logica1.json`)
  - [ ] Delete old `quizStatus` after successful migration
- [ ] **Area Name Display**: Show area name at top of screens
  - [ ] Write tests for area name display in question view
  - [ ] Write tests for area name display in status view ("Ver Estado")
  - [ ] Write tests for area name display in menu screens
  - [ ] Implement area name display across all relevant screens
- [ ] Update GitHub Actions workflow to run unit tests
- [ ] Verify all tests pass and app builds correctly

## Phase 7: Documentation and Versioning
- [ ] Update version history page with new feature description
- [ ] Bump package.json version to 1.3.0
- [ ] Create git commits at each major milestone
- [ ] Final verification and cleanup

## Current Status: Starting project familiarization