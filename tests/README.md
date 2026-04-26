# Tests

Playwright + Chromium E2E tests for My Soccer Lab. See `../testing-policy.md` for the full policy.

## Run

```bash
npm run test:e2e          # headless, both desktop + mobile projects
npm run test:e2e:ui       # interactive Playwright UI (best for writing/debugging tests)
npm run test:e2e:headed   # watch the browser as tests run
npm run test:e2e:report   # open the last HTML report
```

The dev server is started automatically by Playwright (`webServer` in `playwright.config.js`).

## Layout

- `e2e/smoke.spec.js` — auth-free smoke tests (login page renders, protected routes redirect, no runtime errors). Always runs.
- `e2e/dashboard.spec.js.example` — template for authenticated dashboard tests. Rename to `.spec.js` once test credentials are configured.
- `global-setup.js` — signs in once and stores auth state at `.auth/user.json` for tests that need an authenticated session.
- `fixtures/` — shared test data and helpers.

## Authenticated tests — one-time setup

1. In Supabase, create a dedicated test user (e.g. `test@mysoccerlab.dev`) and seed a few matches with goals/shots.
2. Create `.env.test` (gitignored) at the repo root:
   ```
   VITE_TEST_EMAIL=test@mysoccerlab.dev
   VITE_TEST_PASSWORD=...
   ```
3. In `playwright.config.js`, uncomment the `globalSetup` line and add `storageState: 'tests/.auth/user.json'` to the `use` block.
4. Rename `dashboard.spec.js.example` to `dashboard.spec.js`.

## Adding tests

Per CLAUDE.md, **every UI/screen task must include E2E coverage** in both the `chromium-desktop` and `chromium-mobile` projects (Playwright runs both automatically). See `testing-policy.md` for patterns: semantic selectors, perceived state assertions, empty/populated/error coverage, hover-vs-tap for tooltips.
