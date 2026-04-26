import { test, expect } from '@playwright/test'

/**
 * Auth-free smoke tests — verify the app boots and routes work even without
 * a Supabase test account. These run on every CI invocation.
 *
 * For tests that need authenticated state, see dashboard.spec.js.example
 * and configure VITE_TEST_EMAIL / VITE_TEST_PASSWORD in .env.test.
 */

test('login page renders', async ({ page }) => {
  await page.goto('/login')
  // The page title is set by index.html — adjust if you rename the app.
  await expect(page).toHaveTitle(/soccer/i)
  // There must be an input the user can type their email into.
  const emailInput = page.locator('input[type="email"], input[name="email"]').first()
  await expect(emailInput).toBeVisible()
})

test('protected routes redirect to /login when unauthenticated', async ({ page }) => {
  await page.goto('/dashboard')
  // Pages re-fetch supabase.auth.getUser() in onMounted and push to /login.
  await page.waitForURL(/\/login/, { timeout: 5000 })
  expect(page.url()).toMatch(/\/login/)
})

test('home page loads without runtime errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(errors, `Runtime errors: ${errors.join('\n')}`).toHaveLength(0)
})
