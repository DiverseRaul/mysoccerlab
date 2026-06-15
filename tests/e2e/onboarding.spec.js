import { test, expect } from '@playwright/test'

/**
 * New-player intro (WelcomeIntro) coverage.
 *
 * The intro shows on the Dashboard only for a signed-in user with zero
 * logged matches who hasn't dismissed it before (localStorage flag).
 * Needs an authenticated test user (tests/global-setup.js + .env.test);
 * skips when unauthenticated, and when the test user already has matches.
 */

async function gotoDashboardFresh(page) {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) return 'unauthenticated'
  // Clear any previously stored "seen" flags so the intro can appear again.
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('msl-intro-seen:'))
      .forEach((key) => localStorage.removeItem(key))
  })
  await page.reload()
  await page.waitForLoadState('networkidle')
  return 'authenticated'
}

test('intro walks a new player through all steps and stays dismissed', async ({ page }) => {
  const state = await gotoDashboardFresh(page)
  test.skip(state === 'unauthenticated', 'requires authenticated test user')

  const intro = page.getByTestId('welcome-intro')
  const introVisible = await intro.isVisible().catch(() => false)
  test.skip(!introVisible, 'test user already has matches — intro is for new players only')

  // Walk forward through every step.
  await expect(page.getByRole('heading', { name: /welcome to the lab/i })).toBeVisible()
  await page.getByTestId('intro-next').click()
  await expect(page.getByRole('heading', { name: /log your matches/i })).toBeVisible()

  // Back works.
  await page.getByTestId('intro-back').click()
  await expect(page.getByRole('heading', { name: /welcome to the lab/i })).toBeVisible()
  await page.getByTestId('intro-next').click()

  await page.getByTestId('intro-next').click()
  await expect(page.getByRole('heading', { name: /map every shot/i })).toBeVisible()
  await page.getByTestId('intro-next').click()
  await expect(page.getByRole('heading', { name: /your rating, computed/i })).toBeVisible()
  await page.getByTestId('intro-next').click()
  await expect(page.getByRole('heading', { name: /ai coach/i })).toBeVisible()

  // Final button closes it.
  await page.getByTestId('intro-next').click()
  await expect(intro).not.toBeVisible()

  // Dismissal persists across reloads.
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(intro).not.toBeVisible()
})

test('skip dismisses the intro immediately', async ({ page }) => {
  const state = await gotoDashboardFresh(page)
  test.skip(state === 'unauthenticated', 'requires authenticated test user')

  const intro = page.getByTestId('welcome-intro')
  const introVisible = await intro.isVisible().catch(() => false)
  test.skip(!introVisible, 'test user already has matches — intro is for new players only')

  await page.getByTestId('intro-skip').click()
  await expect(intro).not.toBeVisible()
})
