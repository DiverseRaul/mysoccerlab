import { chromium } from '@playwright/test'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'

// Test credentials live in .env.test (gitignored); fall back to .env.
dotenv.config({ path: '.env.test' })
dotenv.config()

/**
 * Signs in once before any test runs and stashes the auth state to
 * tests/.auth/user.json so individual tests reuse the session.
 *
 * To enable:
 *   1. Create a Supabase test user (with some matches/shots logged).
 *   2. Add to .env.test (gitignored):
 *        VITE_TEST_EMAIL=test@example.com
 *        VITE_TEST_PASSWORD=...
 *   3. In playwright.config.js, uncomment:
 *        globalSetup: './tests/global-setup.js'
 *      and add to `use`:
 *        storageState: 'tests/.auth/user.json'
 *
 * If credentials aren't set, this exits cleanly so smoke tests still run.
 */
export default async function globalSetup() {
  const authDir = path.resolve('tests/.auth')
  const statePath = path.join(authDir, 'user.json')
  fs.mkdirSync(authDir, { recursive: true })

  const email = process.env.VITE_TEST_EMAIL
  const password = process.env.VITE_TEST_PASSWORD
  if (!email || !password) {
    console.log('[global-setup] No VITE_TEST_EMAIL/PASSWORD — writing an empty auth state; authenticated specs will skip.')
    // Write an empty (signed-out) state so the `authenticated` project can still
    // load a storageState file without erroring — its specs skip on /login.
    fs.writeFileSync(statePath, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('http://localhost:5174/login')
  await page.locator('input[type="email"], input[name="email"]').first().fill(email)
  await page.locator('input[type="password"], input[name="password"]').first().fill(password)
  await page.getByRole('button', { name: /sign in|log ?in/i }).first().click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  // The new-player intro (WelcomeIntro) now shows for any user who hasn't
  // dismissed it — so dismiss it here and let its "seen" flag persist into the
  // stored state, otherwise the overlay intercepts clicks in every spec.
  // (onboarding.spec.js clears the flag itself to test the intro directly.)
  // Click with a timeout rather than a one-shot isVisible() check, which races
  // the overlay's mount and was silently missing it.
  await page.waitForLoadState('networkidle')
  await page.getByTestId('intro-skip').click({ timeout: 8000 }).catch(() => {})
  // Belt-and-suspenders: ensure the overlay is gone before snapshotting state.
  await page.getByTestId('welcome-intro').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  await context.storageState({ path: path.join(authDir, 'user.json') })
  await browser.close()
}
