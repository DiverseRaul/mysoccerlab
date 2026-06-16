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

## Projects

Four Chromium projects run (see `playwright.config.js`):

- `chromium-desktop` / `chromium-mobile` — **public** specs (smoke, home, share, auth), signed out.
- `chromium-auth-desktop` / `chromium-auth-mobile` — **auth-gated** specs (dashboard, feed, match-map-logger, onboarding, practice, matches, load, admin), loaded with the signed-in `storageState` from `global-setup.js`.

The split keeps the smoke specs (which assert protected routes redirect to `/login` when *un*authenticated) signed out, while the dashboard/feed/etc. specs run with a real session. Mobile is the primary product target, so every screen is covered on both viewports.

## Layout

- `e2e/smoke.spec.js` — auth-free smoke tests (login page renders, protected routes redirect, no runtime errors). Always runs.
- `e2e/dashboard.spec.js`, `feed.spec.js`, `match-map-logger.spec.js`, `load.spec.js`, … — authenticated specs. They self-skip (redirect to `/login`) when no test creds are configured, so the suite stays green out of the box.
- `global-setup.js` — runs once before the suite. With creds present it signs in and writes the auth state to `.auth/user.json`; without creds it writes an empty (signed-out) state so the auth projects still have a `storageState` file to load (their specs then skip).
- `fixtures/` — shared test data and helpers.

## Authenticated tests — one-time setup

Auth specs skip automatically until you configure a test user. To make them run for real:

1. In Supabase, create a dedicated test user (e.g. `test@mysoccerlab.dev`) and seed a few matches with goals/shots (the dashboard data-loads regression test asserts the empty state is absent).
2. Create `.env.test` (gitignored) at the repo root:
   ```
   VITE_TEST_EMAIL=test@mysoccerlab.dev
   VITE_TEST_PASSWORD=...
   ```

That's it — `globalSetup` and the `storageState` wiring are already in `playwright.config.js`. Run `npm run test:e2e`; the `chromium-auth-*` projects will now exercise the authenticated screens instead of skipping.

## Adding tests

Per CLAUDE.md, **every UI/screen task must include E2E coverage** in both the `chromium-desktop` and `chromium-mobile` projects (Playwright runs both automatically). See `testing-policy.md` for patterns: semantic selectors, perceived state assertions, empty/populated/error coverage, hover-vs-tap for tooltips.
