import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

/**
 * Playwright config — see testing-policy.md for the full testing rules.
 *
 * Public (auth-free) specs run on chromium-desktop AND chromium-mobile.
 * Auth-gated specs run on chromium-auth-desktop AND chromium-auth-mobile,
 * which load the signed-in storageState produced by global-setup.js.
 * Mobile is the primary product target per CLAUDE.md, so every screen is
 * covered on both viewports.
 *
 * The auth-gated specs are split out by file so:
 *   - the public projects don't redundantly run+skip them, and
 *   - the auth projects don't run the smoke specs (which assert that
 *     protected routes redirect to /login when *un*authenticated — that
 *     assertion would fail under a signed-in storageState).
 *
 * When VITE_TEST_EMAIL/PASSWORD are absent, global-setup writes an empty
 * (signed-out) state, so the auth specs hit /login and skip — suite stays green.
 */

// Specs that require an authenticated session. Everything else (smoke, home,
// share, auth, admin) is public and must run signed-out — admin.spec.js only
// asserts logged-out redirects, so it stays in the public projects.
const AUTH_SPECS = /(dashboard|feed|match-map-logger|onboarding|practice|matches|load|weekly-training|admin-intro)\.spec\.js$/

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  globalSetup: './tests/global-setup.js',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium-desktop',
      testIgnore: AUTH_SPECS,
      use: { ...devices['Desktop Chrome'] }
    },
    {
      // iPhone 13 viewport but forced onto Chromium so we don't pull WebKit
      // into the install. Chromium-only is the project rule.
      name: 'chromium-mobile',
      testIgnore: AUTH_SPECS,
      use: { ...devices['iPhone 13'], browserName: 'chromium' }
    },
    {
      // Auth-gated specs, signed in via the stored session. Skips cleanly
      // (redirect to /login) when no test creds are configured.
      name: 'chromium-auth-desktop',
      testMatch: AUTH_SPECS,
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/user.json' }
    },
    {
      name: 'chromium-auth-mobile',
      testMatch: AUTH_SPECS,
      use: { ...devices['iPhone 13'], browserName: 'chromium', storageState: 'tests/.auth/user.json' }
    }
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
})
