# Authentication Tests

This directory contains E2E tests that require authentication to be enabled.

## Running these tests

```bash
# Run all auth tests
npx playwright test tests/e2e/auth --reporter=list --project=chromium

# Run a specific auth test
npx playwright test tests/e2e/auth/anonymous-user-flow.spec.ts --reporter=list --project=chromium
```

## What's included

- `anonymous-user-flow.spec.ts` - Tests the anonymous login functionality and user display
- More authentication-related tests can be added here

## Note

Regular e2e tests in the parent directory run with authentication disabled for simplicity and speed.
