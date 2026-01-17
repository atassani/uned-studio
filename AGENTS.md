# AI Agent Instructions (AGENTS.md)

This is a **small public TypeScript project**. AI agents are welcome, but must follow these rules.

## 0) Golden rules
1. **TDD first**: when fixing/adding behavior, start by writing/updating a failing test (Jest or Playwright), then implement.
2. **Commit the failing test first (RED commit)**: the first commit in a change should add a test that fails on `main` (red). Follow up with implementation that makes it pass (green).
3. **Small diffs**: keep changes minimal and localized. Avoid sweeping refactors.
4. **No behavior changes unless requested**: preserve existing functionality and public APIs.
5. **No secrets, ever**: this is a public repo. Never add credentials, tokens, `.env` values, or real endpoints with secrets.
6. **Prefer existing patterns**: match the style and conventions in touched files.

---

## 1) Repository overview
**Purpose:** A web application for taking quizzes/tests on various subjects. Must be usable on the phone.  
**Language:** TypeScript  
**Tests:** Jest (unit), Playwright (e2e)  
**CI/CD:** GitHub (Actions)  
**Deploy:** Static assets to **AWS S3**. Site/app served via **Vercel** (as applicable for this repo).

### Key folders (adjust to match repo)
- `src/` — application/library code
- `tests/unit/` — Jest tests
- `tests/e2e/` — Playwright tests
- `public/` — static assets (if any)
- `.github/workflows/` — CI pipelines
- `scripts/` — helper scripts (build/deploy)

### Invariants / constraints
- Keep the project **dependency-light** (small repo).
- Maintain **fast test runs**; avoid slow e2e unless necessary.
- The repo must remain **public-safe** (no secrets, no private data, no proprietary code).

---

## 2) How to work in this repo
### Preferred workflow (TDD)
1. Identify the smallest slice of behavior to change.
2. Add a **failing** test:
   - Jest for logic/components
   - Playwright for user-visible flows
3. Commit the test alone (**RED commit**).
4. Implement the change to make tests pass.
5. Run the narrowest checks locally.
6. Commit implementation (**GREEN commit**).
7. If needed, refactor **only after** tests are green (and keep refactor small). If refactoring is meaningful, do it as a separate commit.
8. Update docs if behavior or developer workflow changed.

### What to avoid
- Reformat-only commits
- Renaming/moving many files
- Large refactors “for cleanliness”
- Introducing new libraries without a clear need

---

## 3) Setup / build / test commands
> Keep commands current with `package.json`. Prefer `npm ci` in CI.

### Install
```bash
npm ci
```

### Run locally
```bash
npm run dev
```

### Unit tests (Jest)
```bash
npm run test:unit
```

### E2E tests (Playwright, all tests)
```bash
npm run test:e2e
```

### E2E one test (Playwright, focused)
```bash
npx playwright test -g "test name" --reporter=list
```

**Note:** Always use `--reporter=list` for Playwright tests. This provides clear output and makes it easier to cancel with Ctrl+C if a test hangs. Use `--project=chromium` for faster feedback during development.

Example:
```bash
npx playwright test tests/e2e/area-switching.spec.ts --project=chromium --reporter=list
```

### Build
```bash
npm run build
```

---

## 4) Coding standards (TypeScript)
- Follow existing TS config and lint rules.
- Prefer **explicit types** at module boundaries; avoid over-typing internals.
- Avoid `any` unless unavoidable; prefer `unknown` + narrowing.
- Keep functions small and pure when possible.

### Error handling
- Provide actionable error messages.
- Preserve context (`cause` when available).
- Don’t swallow errors silently.

### Logging
- Keep logs minimal.
- Never log secrets or tokens.
- Prefer existing logging utilities (if present).
- Prevent `console.log` in production code unless explicitly allowed.

---

## 5) Testing rules (TDD)
### Core process (required)
- For any bugfix/feature, use **2 commits**:
  1) **RED commit**: add a failing test only (no implementation changes)
  2) **GREEN commit**: implementation to make it pass
- If the failing test cannot be committed (e.g. test requires unavailable infrastructure or is unavoidably flaky), explain why clearly in the PR.

### Test scripts: unit and E2E
- `npm test` runs both Jest unit tests and Playwright E2E tests (sequentially).
- `npm run test:unit` runs only Jest unit tests.
- `npm run test:e2e` runs only Playwright E2E tests.
- Use the focused Playwright command for a single E2E test:
  ```bash
  npx playwright test tests/e2e/your-test.spec.ts --reporter=list --project=chromium
  ```
- This setup allows you to run all or just one type of test as needed.

### Jest (unit/integration)
- Use Jest for deterministic logic and fast feedback.
- For bugfixes: add a regression test that fails before the fix.

### Playwright (e2e)
- Use Playwright only for true end-to-end behavior.
- Avoid flaky tests:
  - Use stable selectors (e.g., `data-testid` if the repo uses it).
  - Prefer assertions like `expect(...).toBeVisible()` over arbitrary timeouts.
- Keep e2e scenarios short and focused.
- Playwright E2E tests should use the shared helpers in `tests/e2e/helpers.ts` for consistent initialization and cleanup, unless have special conditions.
- In each test file, use `beforeEach` to call `setupFreshTest(page)` and `waitForAppReady(page)` to ensure the app is loaded and in a clean state before each test.
- Example:
  ```typescript
  import { setupFreshTest, waitForAppReady } from './helpers';
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
    await waitForAppReady(page);
    await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
  });
  ```
- This ensures all tests start from the initial page and are reliable across environments.

---

## 6) Security + public repo hygiene
- Never add `.env` with real values.
- Never hardcode AWS keys, Vercel tokens, webhook secrets, etc.
- Any example config must use placeholders:
  - `EXAMPLE_API_KEY=replace_me`
- Avoid adding dependencies with known security issues.

---

## 7) Dependency policy (small project)
Before adding a dependency:
1. Check if it already exists.
2. Prefer standard library or existing utilities.
3. Justify why it’s necessary (size, maintenance, security).
4. Avoid heavy frameworks for small tasks.

---

## 8) Deployment notes (S3 + Vercel)
### S3 (static deploy)
- Build output is in `out/`.
- Deployment should upload built assets to an S3 bucket.
- Never modify deploy workflows without an explicit request.

### Vercel
- Vercel deployment should be reproducible via GitHub integration.
- Avoid environment-variable changes in code; document them instead.

---

## 9) GitHub workflow expectations
- Assume CI runs: lint, typecheck, Jest, and (optionally) Playwright.
- Keep PRs small and reviewable.
- If CI fails, fix the root cause rather than weakening checks.

### Commit message style (Conventional Commits)
We follow [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages:
- Prefix each commit with a type and a short description.
- Examples:
  - `feat: add keyboard shortcuts for MCQ answers`
  - `fix: always start at first question in section`
  - `docs: update agent instructions`
  - `test: add regression test for sequential order`
  - `refactor: simplify question loading logic`
  - `chore: update dependencies`

### CHANGELOG.md usage
- We maintain a `CHANGELOG.md` at the root of the project.
- For every pull request, add an entry under an "Unreleased" section describing the change.
- When a release is made, move all "Unreleased" entries under the new version heading with the release date.
- Example structure:
  ```markdown
  ## [Unreleased]
  - feat: add keyboard shortcuts for MCQ answers
  - fix: sequential order always starts at first question

  ## [1.4.0] - 2026-01-17
  - feat: add appearsIn field to questions
  - fix: prevent cross-area localStorage contamination
  ```

### PR description should include
- What changed (1–3 bullets)
- Why it changed
- How to test locally
- Any deployment impact (S3/Vercel)
- Mention the **RED/GREEN commit structure** when relevant

---

## 10) Git workflow and pull requests

### Creating a feature branch
- Before starting work, create a branch from `main`:
  ```bash
  git checkout -b feature/short-description
  ```

### Pull request process
1. **Push your feature branch to GitHub:**
   ```bash
   git push -u origin feature/short-description
   ```

2. **Create the pull request on GitHub:**
   - Navigate to: https://github.com/atassani/uned-tests
   - Click "Compare & pull request" for your feature branch.
   - Use a descriptive title following Conventional Commits (e.g., `feat: add appearsIn field to questions`).
   - In the description, summarize:
     - What changed
     - Why it changed

3. **After review and approval:**
   - Click "Merge pull request" on GitHub.
   - Delete the remote branch using the GitHub UI button.

4. **Clean up locally:**
   ```bash
   git checkout main
   git pull
   git branch -d feature/short-description
   ```

### Working with commits
- Keep commits focused and atomic.
- Use the TDD RED-GREEN cycle: commit failing tests separately, then commit implementation.
- Write clear commit messages following Conventional Commits format.

---

## 11) Agent output format (what to include in responses)
When you propose or implement changes, include:
1. **Plan** (short, TDD-oriented)
2. **Tests added/updated** (Jest/Playwright)
3. **Code changes** (high level)
4. **Commits** (explicit: which is RED vs GREEN)
5. **Files modified**
6. **How to verify** (commands)

---

## 12) Allowed / disallowed actions
### Allowed
✅ Add/adjust Jest tests  
✅ Add/adjust Playwright tests (focused, non-flaky)  
✅ Fix bugs with minimal diffs  
✅ Improve clarity in touched code  
✅ Update docs for changed behavior/commands  

### Disallowed unless explicitly asked
❌ Re-architecting the project  
❌ Replacing Jest/Playwright/tooling  
❌ Large-scale refactors or renames  
❌ Changing deploy pipelines (S3/Vercel)  
❌ Adding many dependencies
