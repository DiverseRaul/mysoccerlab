import { test, expect } from '@playwright/test'

/**
 * Load Management widget + Tactical Heatmap coverage. Both live behind the
 * authenticated dashboard, so they redirect to /login without a test user and
 * skip — matching the existing matches/practice authenticated specs. Configure
 * tests/global-setup.js + .env.test to exercise the real assertions.
 */

async function gotoDashboard(page) {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) return false
  // Dismiss the welcome intro if it's showing (it intercepts clicks).
  await page.getByTestId('intro-skip').click({ timeout: 1500 }).catch(() => {})
  // The Load Management widget is an advanced-mode tile on the overview. The
  // Simple/Advanced toggle now lives in the settings (gear) dropdown — open it,
  // then switch to Advanced.
  await page.locator('.settings-trigger').click({ timeout: 3000 }).catch(() => {})
  await page.getByRole('button', { name: 'Advanced', exact: true }).click({ timeout: 3000 }).catch(() => {})
  return true
}

test('load management widget renders with a zone label', async ({ page }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  const widget = page.getByTestId('load-management-widget')
  await expect(widget).toBeVisible()
  await expect(widget.locator('.load-widget__zone-pill')).toBeVisible()
})

test('load widget quick-log form is reachable and does not overflow on mobile', async ({ page, isMobile }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  const widget = page.getByTestId('load-management-widget')
  await widget.scrollIntoViewIfNeeded()
  await expect(page.locator('#LoadMinutes')).toBeVisible()
  await expect(page.locator('.load-widget__submit')).toBeVisible()
  if (isMobile) {
    const fits = await widget.evaluate((el) => Math.ceil(el.getBoundingClientRect().right) <= window.innerWidth + 1)
    expect(fits).toBe(true)
  }
})

test('logging a load entry updates the gauge readout', async ({ page }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  await page.locator('#LoadMinutes').fill('75')
  await page.locator('.load-widget__submit').click()
  await expect(page.getByTestId('load-management-widget')).toContainText('min / 7 days')
})
