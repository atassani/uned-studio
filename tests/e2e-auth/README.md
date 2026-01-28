# Authentication Tests

This directory contains E2E tests that require authentication to be enabled.

## Running these tests

These tests need `NEXT_PUBLIC_DISABLE_AUTH=false` to work properly:

```bash
# Run all auth tests
NEXT_PUBLIC_DISABLE_AUTH=false npx playwright test tests/e2e/auth --reporter=list --project=chromium

# Run a specific auth test
NEXT_PUBLIC_DISABLE_AUTH=false npx playwright test tests/e2e/auth/anonymous-user-flow.spec.ts --reporter=list --project=chromium
```

## What's included

- `anonymous-user-flow.spec.ts` - Tests the anonymous login functionality and user display
- More authentication-related tests can be added here

## Note

Regular e2e tests in the parent directory run with authentication disabled for simplicity and speed.
