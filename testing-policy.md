# Testing Policy — My Soccer Lab

This file is the source of truth for **how to test changes in this repo**. CLAUDE.md links here. If you're modifying or adding code, read this first.

**Playwright + Chromium is installed and ready.** Run `npm run test:e2e` to execute the full suite (desktop + mobile). Add new specs under `tests/e2e/`. See `tests/README.md` for layout. Vitest is not yet installed — the first PR that adds a unit test installs it per the Vitest section below.

**E2E tests are required on every task that touches a screen / route / tile / form / user-facing UI behavior.** No "tests deferred" disclaimers — the change is not done until the test is in place and the suite passes.

---

## Philosophy

This is a Vue 3 + Supabase player-analytics SPA. Almost every bug shows up as one of three things:

1. A **wrong number on screen** (rating engine miscalc, stat aggregation off)
2. A **tile that doesn't render** (data shape changed, RLS denied, prop missing)
3. A **click/tap that does nothing** (event handler wired wrong, mobile tap target broken)

So the testing strategy is: **test what the user sees, not what the code does.**

Prefer end-to-end tests for UI work. Reserve unit tests for genuinely pure functions (the rating engine, formatters, aggregators). Don't write Vue component tests in isolation — they tend to test framework wiring rather than product behavior, and Playwright covers the same ground with much higher signal.

---

## Decision table — what to write when

| Change | Required tests |
|---|---|
| New screen / new dashboard tile | E2E (Playwright) at **mobile + desktop** viewports |
| Modify existing UI (layout, content, interaction, filter, tooltip) | E2E covering the affected flow + a regression case for the specific bug if applicable |
| Bug fix in UI | E2E regression test that **fails before the fix and passes after** |
| New / changed pure function in `src/lib/` (rating, formatters, aggregators) | Unit test (Vitest) — happy path + 2-3 realistic edge cases |
| Bug fix in pure function | Unit regression test for the exact failing input |
| New Supabase table / column | Manual SQL verification + E2E test that exercises the new data path through the UI |
| New / changed RLS policy | **Two-account E2E test** (User A vs User B visibility) — RLS denials silently return `[]`, so you cannot catch this in unit tests |
| Edge Function (`supabase/functions/*`) change | Manual `curl` against the deployed function + E2E with the function response mocked via `page.route()` |
| Refactor with no behavior change | Existing tests must still pass; no new tests required |
| CSS-only change (no behavior) | Manual mobile/desktop viewport check; no automated test |
| Docs / comments only | None |

If you're not sure: write an **E2E test**. UI bugs are the dominant failure mode in this product.

---

## E2E with Playwright + Chromium

Playwright is the official E2E framework. Chromium-only is fine — we don't have iOS-Safari-specific or Firefox-specific concerns.

### Setup (already done — keep this section as a reference for re-bootstrapping)

The repo is configured. If you ever need to re-bootstrap from scratch:

```bash
npm install -D @playwright/test dotenv
npx playwright install chromium
```

The current `playwright.config.js` at the repo root looks like:

```javascript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    storageState: 'tests/.auth/user.json',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    // iPhone 13 viewport but forced to chromium so we don't pull WebKit
    // into the install. Chromium-only is the project rule.
    { name: 'chromium-mobile',  use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  globalSetup: './tests/global-setup.js',
})
```

Add to `package.json`:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui",
"test:e2e:headed": "playwright test --headed"
```

Add to `.gitignore`:

```
tests/.auth/
test-results/
playwright-report/
```

### Mobile + desktop is mandatory

Mobile is the primary target per CLAUDE.md. Every UI E2E test runs in **both** projects (`chromium-desktop` and `chromium-mobile`) automatically — that's how the config is set up. Don't skip mobile with `test.skip(isMobile)` unless the feature is genuinely desktop-only (and explain why in a code comment).

If a feature works at 1280px but breaks at 390px, **the feature is broken** and the test must catch it.

### Authentication

Use a real Supabase test account, not mocks. RLS, policies, and real data shape matter — a mocked auth happy-path will hide exactly the bugs that ship.

`.env.test` (gitignored):

```
VITE_TEST_EMAIL=test@mysoccerlab.dev
VITE_TEST_PASSWORD=...
```

`tests/global-setup.js` signs in once and stores the auth state for all tests to reuse:

```javascript
import { chromium } from '@playwright/test'
import 'dotenv/config'
import fs from 'node:fs'

export default async () => {
  fs.mkdirSync('tests/.auth', { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.goto('http://localhost:5173/login')
  await page.getByLabel(/email/i).fill(process.env.VITE_TEST_EMAIL)
  await page.getByLabel(/password/i).fill(process.env.VITE_TEST_PASSWORD)
  await page.getByRole('button', { name: /sign in|log in/i }).click()
  await page.waitForURL(/\/dashboard/)
  await page.context().storageState({ path: 'tests/.auth/user.json' })
  await browser.close()
}
```

### File layout

```
tests/
  e2e/
    auth.spec.js          # login, signup, OAuth redirect, session restore
    dashboard.spec.js     # overview tiles, header tiles, charts
    matches.spec.js       # add/edit/delete matches, event capture
    shot-map.spec.js      # filters, view toggle, hover/tap tooltips
    feed.spec.js          # follow graph + RLS visibility
    ai-coach.spec.js      # chat round-trip with mocked Edge Function
  unit/
    rating.spec.js        # calculateMatchRating per position
  fixtures/
    sample-matches.js     # known match data for assertions
  global-setup.js
```

### Patterns

**Use semantic selectors, not CSS classes.** Classes change on every styling refactor; ARIA roles and visible text don't.

```javascript
// ✅ resilient
await page.getByRole('button', { name: 'Add Match' }).click()
await expect(page.getByText('Win Record')).toBeVisible()

// ❌ breaks the next time we rename a class
await page.locator('.win-record-tile').click()
```

**Test the user's perceived state, not Vue internals.**

```javascript
// ✅ what the user sees
await expect(page.getByText('5 wins')).toBeVisible()

// ❌ component plumbing
await expect(component.vm.wins).toBe(5)
```

**Cover empty / populated / error states for every screen change.** Empty states are where bugs live (RLS denial, no data for new user, etc.).

```javascript
test('shot map shows empty state when no shots logged', async ({ page }) => {
  await seedUser({ matches: 0 })
  await page.goto('/dashboard')
  await expect(page.getByText('No shot placements logged yet')).toBeVisible()
})

test('shot map renders markers for logged shots', async ({ page }) => {
  await seedUser({ matches: 1, shots: 3, goals: 1 })
  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'Shot Origins' }).click()
  await expect(page.locator('.marker')).toHaveCount(4)
})
```

**Tooltip / hover** — use `.hover()` then assert the tooltip's content. On mobile, use `.tap()` and confirm the tap-to-show-tap-outside-to-dismiss flow:

```javascript
test('shot tooltip shows match info on hover (desktop)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop hover only')
  await page.goto('/dashboard')
  await page.locator('.marker--goal').first().hover()
  await expect(page.locator('.shot-tooltip')).toBeVisible()
  await expect(page.locator('.shot-tooltip')).toContainText('vs ')
})

test('shot tooltip toggles on tap (mobile)', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile tap only')
  await page.goto('/dashboard')
  const marker = page.locator('.marker').first()
  await marker.tap()
  await expect(page.locator('.shot-tooltip')).toBeVisible()
  await page.locator('body').tap({ position: { x: 5, y: 5 } })
  await expect(page.locator('.shot-tooltip')).toBeHidden()
})
```

**Two-account RLS tests** — RLS denials return `[]` not errors, so unit tests can't catch them. The only honest way to test visibility rules is to spin up two contexts:

```javascript
test('private profile is hidden from non-followers', async ({ browser }) => {
  const userA = await browser.newContext({ storageState: 'tests/.auth/user-a.json' })
  const pageA = await userA.newPage()
  await pageA.goto('/feed')
  await expect(pageA.getByText('UserB')).toBeHidden()
})
```

### When you mock and when you don't

Don't mock the database. Don't mock auth. Don't mock the rating engine. Use the real ones — those are exactly the surfaces where bugs live in this product.

**Do** mock the AI Coach Edge Function via `page.route()`, because:
- Real calls cost Gemini API quota
- Tests should be deterministic, and LLM responses aren't
- The function's behavior is its own thing; the UI's job is to send/receive correctly

```javascript
await page.route('**/functions/v1/ai-coach', route => {
  route.fulfill({ json: { reply: 'Test response from coach.' } })
})
```

---

## Unit tests with Vitest

Pure functions only — `src/lib/`. The rating engine (`src/lib/rating.js`) is the most important target: ~500 lines of position-aware formula that absolutely needs a regression net before any tweak.

### Setup (one time)

```bash
npm install -D vitest @vue/test-utils jsdom
```

`vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: { environment: 'jsdom', globals: true },
  resolve: { alias: { '@': '/src' } },
})
```

`package.json`:

```json
"test:unit": "vitest run",
"test:unit:watch": "vitest"
```

### Patterns

Cover each branch of `POSITION_FLAGS` — at minimum a goalkeeper, a striker, a central midfielder, and a center-back. Use **realistic match values** (a real-looking 90-minute stat line), not synthetic all-zeros — those don't catch the formula bugs that actually ship.

```javascript
import { describe, it, expect } from 'vitest'
import { calculateMatchRating } from '@/lib/rating'

describe('calculateMatchRating — striker', () => {
  it('rates a hat-trick around 9.0+', () => {
    const rating = parseFloat(calculateMatchRating({
      position_played: 'Striker',
      my_goals: 3, assists: 0,
      shots_on_target: 5, shots_off_target: 1,
      successful_passes: 18, unsuccessful_passes: 4,
      score_for: 4, score_against: 1,
    }))
    expect(rating).toBeGreaterThanOrEqual(8.5)
    expect(rating).toBeLessThanOrEqual(10)
  })

  it('rates a 0-shot 0-goal striker performance below 6.0', () => {
    const rating = parseFloat(calculateMatchRating({
      position_played: 'Striker',
      my_goals: 0, assists: 0,
      shots_on_target: 0, shots_off_target: 0,
      successful_passes: 8, unsuccessful_passes: 6,
      score_for: 0, score_against: 2,
    }))
    expect(rating).toBeLessThan(6.0)
  })
})

describe('calculateMatchRating — goalkeeper', () => {
  it('rates a clean sheet with 6 saves around 8.0+', () => {
    /* ... */
  })
})
```

When you find a regression bug in the rating engine, **add a test for the exact failing match shape before fixing the bug**, so the same bug can't slip back in.

---

## Database & RLS

There is no Supabase migration runner — migrations are applied by hand. So:

1. Run the migration in **staging** Supabase first, never directly in prod.
2. `SELECT` to verify the change.
3. Add an E2E test that exercises the data path through the UI.
4. For RLS specifically: write a **two-account E2E** as shown above. There is no other way to catch RLS bugs reliably.

---

## Edge Functions (`supabase/functions/*`)

For changes to `ai-coach/index.ts`:

1. Deploy to staging if available, or test locally with `supabase functions serve`.
2. Hit it with `curl`:
   ```bash
   curl -X POST $SUPABASE_URL/functions/v1/ai-coach \
     -H "Authorization: Bearer $ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"messageParts":[{"text":"hi"}],"userMatches":[],"userPosition":"Striker"}'
   ```
3. Verify the response shape, then exercise the full path through the UI in an E2E with `page.route()` mocking the function response so the test stays deterministic.

---

## Mobile-first verification (always)

Before reporting any UI task complete:

- [ ] Manually open the dev server in a browser at **375px viewport** (Chrome DevTools → toggle device toolbar).
- [ ] No horizontal scroll on any screen.
- [ ] Tap targets are **at least 44 × 44px** (Apple HIG minimum).
- [ ] No text overflow / clipping. Long opponent names, long player names, multi-line stats all render OK.
- [ ] Tooltips, dropdowns, and modals don't extend off-screen.
- [ ] Charts and SVG content scale down without breaking.
- [ ] If the change involves position-fixed or transformed elements: **test that combination** — `transform` on an ancestor breaks `position: fixed` (this has bitten us before; see the ShotMap tooltip / `<Teleport>` history).

CLAUDE.md states mobile is the primary priority. That's not a suggestion.

---

## Honest reporting

If something is genuinely untestable (a CSS-only visual tweak, a third-party-library quirk, anything where writing a test would be ceremony), **say so explicitly** when reporting the task complete. Don't write a fake test that doesn't actually exercise the change.

Type checking and a green build verify code correctness, not feature correctness. If you can't validate the feature itself, say so plainly rather than implying success.

---

## CI — not yet wired up

There is no CI test runner today. When CI is added:

- Run `npm run test:unit` on every PR (fast, no infra).
- Run `npm run test:e2e` only on PRs that touch `src/components/`, `src/lib/`, `src/main.js`, or `database/`.
- Skip E2E for docs-only PRs (path filter).
- Use a dedicated Supabase staging project with seeded test data — never run E2E against the prod project.
