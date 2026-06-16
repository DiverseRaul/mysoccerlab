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

test('intro asks for a path, walks the Training tour, and opens Training mode', async ({ page }) => {
  const state = await gotoDashboardFresh(page)
  test.skip(state === 'unauthenticated', 'requires authenticated test user')

  const intro = page.getByTestId('welcome-intro')
  const introVisible = await intro.isVisible().catch(() => false)
  test.skip(!introVisible, 'intro already dismissed for this user')

  // Phase 1: choose a path.
  await expect(page.getByTestId('intro-choose')).toBeVisible()
  await expect(page.getByRole('heading', { name: /what brings you here/i })).toBeVisible()
  await page.getByTestId('intro-choice-training').click()

  // Phase 2: the Training tour starts on the welcome step.
  await expect(page.getByRole('heading', { name: /welcome to the lab/i })).toBeVisible()
  await page.getByTestId('intro-next').click()
  await expect(page.getByRole('heading', { name: /pick a drill/i })).toBeVisible()

  // Back to welcome, then walk forward to the end (step count varies by path).
  await page.getByTestId('intro-back').click()
  await expect(page.getByRole('heading', { name: /welcome to the lab/i })).toBeVisible()

  for (let i = 0; i < 8 && await intro.isVisible().catch(() => false); i++) {
    await page.getByTestId('intro-next').click()
  }
  await expect(intro).not.toBeVisible()

  // The chosen path put the dashboard into Training mode...
  await expect(page.getByTestId('mode-training')).toHaveClass(/is-active/)
  // ...and the dismissal persists across reloads.
  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(intro).not.toBeVisible()
})

test('back from the first tour step returns to the path chooser', async ({ page }) => {
  const state = await gotoDashboardFresh(page)
  test.skip(state === 'unauthenticated', 'requires authenticated test user')

  const intro = page.getByTestId('welcome-intro')
  const introVisible = await intro.isVisible().catch(() => false)
  test.skip(!introVisible, 'intro already dismissed for this user')

  await page.getByTestId('intro-choice-matches').click()
  await expect(page.getByRole('heading', { name: /welcome to the lab/i })).toBeVisible()
  await page.getByTestId('intro-back').click()
  await expect(page.getByTestId('intro-choose')).toBeVisible()
})

test('skip dismisses the intro immediately', async ({ page }) => {
  const state = await gotoDashboardFresh(page)
  test.skip(state === 'unauthenticated', 'requires authenticated test user')

  const intro = page.getByTestId('welcome-intro')
  const introVisible = await intro.isVisible().catch(() => false)
  test.skip(!introVisible, 'intro already dismissed for this user')

  await page.getByTestId('intro-skip').click()
  await expect(intro).not.toBeVisible()
})
