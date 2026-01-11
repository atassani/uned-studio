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
- [x] **UI Consistency**: Change Multiple Choice display from option buttons to text + A/B/C buttons
  - [x] Write failing test for MCQ text display format
  - [x] Implement MCQ text display with A/B/C buttons at bottom
  - [x] Ensure A/B/C buttons work correctly
- [x] **Backward Compatibility**: Migrate existing localStorage data
  - [x] Write test for localStorage migration from `quizStatus` to `quizStatus_questions_logica1`
  - [x] Implement migration logic on app startup
  - [x] Remove `.json` suffix from localStorage keys (use `quizStatus_questions_logica1` not `quizStatus_questions_logica1.json`)
  - [x] Delete old `quizStatus` after successful migration
- [x] **Area Name Display**: Show area name at top of screens
  - [x] Write tests for area name display in question view
  - [x] Write tests for area name display in status view ("Ver Estado")
  - [x] Write tests for area name display in menu screens
  - [x] Implement area name display across all relevant screens
  - [x] **Icon Update**: Change area display icon from 📚 to 🎓 (mortarboard)

## Phase 8: Final Status (**COMPLETED**)
- [x] All 42 Playwright tests passing ✅
- [x] TDD process followed for all new requirements
- [x] UI consistency achieved between True/False and Multiple Choice
- [x] Backward compatibility maintained with localStorage migration
- [x] Area names displayed with mortarboard icon 🎓
- [x] Ready for production deployment
- [ ] Update GitHub Actions workflow to run unit tests
- [ ] Verify all tests pass and app builds correctly

## Phase 9: MCQ Expected Answer Display (**COMPLETED**)
- [x] **Enhanced MCQ Results Display**: Show expected answer in specific format
  - [x] Write failing test for expected answer display format
  - [x] Format should be: "Respuesta esperada A) The text of the option"
  - [x] Implement expected answer display for incorrect MCQ answers
  - [x] Verify correct formatting with all MCQ option letters (A, B, C)
  - [x] Ensure feature works across all MCQ areas
  - [x] All 45 Playwright tests passing ✅

## Phase 10: Complete Area Name Display (**COMPLETED**)
- [x] **Missing Area Name with Mortarboard**: Add area name display to remaining pages
  - [x] Write tests for area name display on menu page (below "¿Cómo quieres las preguntas?")
  - [x] Write tests for area name display on "Seleccionar secciones" screen
  - [x] Write tests for area name display on "Seleccionar preguntas" screen  
  - [x] Write tests for area name display on MCQ answer page
  - [x] Write tests for area name display on True/False answer page
  - [x] Implement area name with 🎓 icon on all missing pages
  - [x] Ensure consistent styling and positioning across all screens
  - [x] All 60 Playwright tests passing ✅

## Phase 11: Area Memory and Persistence (**NEW REQUIREMENT**)
- [x] **localStorage Area Memory**: Remember and restore user's area (**COMPLETED**)
  - [x] Write tests for area persistence in localStorage
  - [x] Write tests for returning to last studied area on app reload
  - [x] Write tests for migration from old "quizStatus" to Lógica I area
  - [x] Implement localStorage key for current area (e.g., "currentArea")
  - [x] Implement automatic area restoration on app startup
  - [x] Implement backward compatibility: old "quizStatus" → migrate to Lógica I
  - [x] Ensure quiz progress is preserved when switching areas

## Phase 12: Enhanced "Cambiar área" Navigation (**IN PROGRESS**)
- [x] Write tests for "Cambiar área" button on question page (next to "Ver estado")
- [x] Write tests for "Cambiar área" button on answer pages (both MCQ and True/False)
- [x] Write tests for "Cambiar área" button on "Seleccionar secciones" page
- [x] Write tests for "Cambiar área" button on "Seleccionar preguntas" page
- [x] Write tests for "Cambiar área" button on "Quiz completado" page
- [x] Write tests for continuing where you left off after area change
- [x] Implement "Cambiar área" buttons with consistent styling
- [x] Implement logic to preserve progress in both areas when switching
- [x] Ensure area switching works from any screen in the app
- [x] Implement and display 'Cambiar área' button on answer pages
  - [x] Add a visible and functional 'Cambiar área' button to both MCQ and True/False answer pages. Ensure it returns to area selection and preserves progress.
- [x] Implement and display 'Cambiar área' button on 'Seleccionar secciones' page
  - [x] Add a visible and functional 'Cambiar área' button to the section selection page. Ensure it returns to area selection and preserves progress.
- [x] Implement and display 'Cambiar área' button on 'Seleccionar preguntas' page
  - [x] Add a visible and functional 'Cambiar área' button to the question selection page. Ensure it returns to area selection and preserves progress.
- [x] Implement and display 'Cambiar área' button on 'Quiz completado' page
  - [x] Add a visible and functional 'Cambiar área' button to the quiz completed/results page. Ensure it returns to area selection and preserves progress.

## Phase 13: Short Area Names in Selection (**COMPLETED**)
- [x] **Compact Area Selection**: Add short names for better UX
  - [x] Write tests for short area names display in area selection
  - [x] Add "shortName" field to areas.json (log1, ipc)
  - [x] Write tests for short names with full names below in smaller font
  - [x] Update area selection UI to show short names prominently
  - [x] Display full area names in smaller text below short names
  - [x] Refactor all localStorage keys and area logic to use shortName 
  - [x] Update Playwright tests for area switching and progress restoration
  - [x] Fix async race conditions in area switching logic
  - [x] Ensure responsive design works with new layout
  - [x] All 21 Playwright tests passing with robust area switching

**Phase 13 Status: COMPLETED** - Short area names are fully implemented with robust area switching and progress preservation.

## Phase 14: Sequential Question Order Option (**NEW REQUIREMENT**)
- [x] Add UI for question order selection (random/sequential)
- [x] Persist question order preference per area in localStorage
- [x] Apply question order to all-questions mode
- [x] Apply question order to section selection mode
- [x] Apply question order to custom question selection mode
- [x] Add Playwright tests for all modes and persistence
- [ ] **NEW: If sequential is selected, it must apply to all quiz modes (all, sections, questions) and be respected everywhere.**
- [ ] **NEW: Fix localStorage persistence and area selection UI after reload so user preference is always restored and accessible.**

### User Request (2026-01-11)
- If sequential is selected, it is applied for all the options including selecting sections and selecting questions.
- Fix the localStorage persistence test and the UI after reload.

### Implementation Plan
- Refactor QuizApp logic so sequential order is always respected for all quiz modes.
- Ensure localStorage persistence and UI restoration after reload.
- Update Playwright tests if needed.

## Phase 9: Ongoing Process & Test Discipline (2026-01-11)
- [x] Add agent discipline reminders:
  - Always add new feature suggestions to AGENT_PLAN before implementation
  - Always write or update Playwright tests before implementing new features (TDD)
  - Always update AGENT_PLAN after completing a feature or test
- [x] Add Playwright tests for:
  - Area button resumes at last question if progress exists
  - "Todas las preguntas" always starts fresh, even if progress exists
- [x] Fix Playwright test imports and ensure all tests run before/after changes
- [x] Confirm all tests pass after recent changes

## Phase 7: Documentation and Versioning
- [ ] Update version history page with new feature description
- [ ] Bump package.json version to 1.3.0
- [ ] Create git commits at each major milestone
- [ ] Final verification and cleanup

## Current Status: Ready to begin Phase 14 - Sequential Question Order Option

## Playwright Test Execution Best Practices

\- Always run Playwright tests with `--reporter=list` for clear output and easier cancellation.
\- Set Playwright test timeout to 5 seconds for fast feedback. (See playwright.config.ts: `timeout: 3000`)
\- Example: `npx playwright test tests/area-navigation.spec.ts --project=chromium --reporter=list`
\- If a test run hangs, use Ctrl+C to cancel, then re-run with the correct reporter flag.

## New UI/UX and Label Changes (2026-01-11)
- [ ] Shorten status line for mobile: Update the quiz status line to be shorter and fit on mobile screens.
- [ ] Change 'Empezar quiz' label to 'Empezar': Update the button label from 'Empezar quiz' to 'Empezar' throughout the app.
- [ ] Rename 'Ver Estado' button to 'Options': Change the label of the 'Ver Estado' button to 'Options', reflecting its expanded functionality (restart, change area, etc.).
- [ ] Remove 'Cambiar área' button from question view: Remove the 'Cambiar área' button from the question view to improve mobile layout.

## Test Discipline & Maintenance
- [ ] Make all Playwright tests pass: Review and fix all failing Playwright E2E tests, focusing on area switching, persistence, and sequential order logic. Update code or tests as needed until all tests pass.
- [x] Fix npm run build errors: Investigate and resolve any issues preventing 'npm run build' from succeeding in the Next.js project. Ensure a successful production build.