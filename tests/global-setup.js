import { chromium } from '@playwright/test'
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'

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
  const email = process.env.VITE_TEST_EMAIL
  const password = process.env.VITE_TEST_PASSWORD
  if (!email || !password) {
    console.log('[global-setup] No VITE_TEST_EMAIL/PASSWORD — skipping auth bootstrap.')
    return
  }

  const authDir = path.resolve('tests/.auth')
  fs.mkdirSync(authDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto('http://localhost:5173/login')
  await page.locator('input[type="email"], input[name="email"]').first().fill(email)
  await page.locator('input[type="password"], input[name="password"]').first().fill(password)
  await page.getByRole('button', { name: /sign in|log ?in/i }).first().click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  await context.storageState({ path: path.join(authDir, 'user.json') })
  await browser.close()
}
