import { test, expect } from '@playwright/test'

/**
 * Overhauled Dashboard coverage: scrollable tab row must not overflow on
 * mobile, tabs switch views, and the AI Coach nav link opens the AI Coach.
 *
 * These need an authenticated session (see tests/global-setup.js + .env.test).
 * When no test user is configured the route redirects to /login and the test
 * skips, keeping the suite green; configure auth to exercise them.
 */

async function gotoDashboard(page) {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  const onLogin = page.url().includes('/login')
  if (onLogin) return false
  // A brand-new test user gets the welcome intro; dismiss it so it
  // doesn't intercept clicks (see onboarding.spec.js for its coverage).
  const skip = page.getByTestId('intro-skip')
  if (await skip.isVisible().catch(() => false)) await skip.click()
  return true
}

test('dashboard tab row does not overflow on mobile', async ({ page }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  const tabs = page.getByTestId('scrollable-tabs').first()
  await expect(tabs).toBeVisible()
  const fitsViewport = await tabs.evaluate((el) => {
    return Math.ceil(el.getBoundingClientRect().right) <= window.innerWidth + 1
  })
  expect(fitsViewport).toBe(true)
})

test('dashboard tabs switch the active view', async ({ page }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  await page.getByRole('button', { name: 'Matches' }).click()
  await expect(page.getByRole('button', { name: 'Matches' })).toHaveClass(/is-active/)
})

test('AI Coach nav link opens the AI Coach screen', async ({ page }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  const link = page.getByRole('link', { name: /AI Coach/i }).first()
  await expect(link).toBeVisible()
  await link.click()
  await expect(page).toHaveURL(/\/coach$/)
})

test('dashboard shows the page hero and pitch insights tile', async ({ page }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  await expect(page.getByTestId('page-hero')).toBeVisible()
  const pitch = page.getByTestId('pitch-insights-passes')
  await expect(pitch).toBeVisible()
  await pitch.click()
  await expect(page.getByTestId('pitch-insights-passes-view')).toBeVisible()
  await page.getByTestId('pitch-insights-heatmap').click()
  await expect(page.getByTestId('pitch-insights-heatmap-view')).toBeVisible()
})

test('page does not overflow horizontally on mobile', async ({ page, isMobile }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  test.skip(!isMobile, 'mobile overflow check')
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(1)
})
