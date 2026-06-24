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

test('sub-tab indicator tracks the active tab', async ({ page }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  // Switch to Training mode (3 tabs, no MatchManager) and check the sliding
  // pill indicator lands centred on the active tab after switching tabs.
  await page.getByTestId('mode-training').click()
  await page.getByRole('button', { name: 'Drills' }).click()
  await expect(page.getByRole('button', { name: 'Drills' })).toHaveClass(/is-active/)
  await page.waitForTimeout(500) // let the indicator finish sliding
  const aligned = await page.evaluate(() => {
    const ind = document.querySelector('.cb-tabs .scrollable-tabs__indicator')?.getBoundingClientRect()
    const act = document.querySelector('.cb-tabs .scrollable-tabs__pill.is-active')?.getBoundingClientRect()
    if (!ind || !act) return false
    return Math.abs((ind.left + ind.width / 2) - (act.left + act.width / 2)) <= 6
  })
  expect(aligned).toBe(true)
})

test('AI Coach nav link opens the AI Coach screen', async ({ page, isMobile }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  // AI Coach is a top-nav link on desktop and a bottom-nav tab on mobile —
  // either way it's a directly visible link, no menu to open first.
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

test('settings menu: Simple/Advanced toggle drives Advanced mode', async ({ page }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  // The Simple/Advanced toggle now lives inside the settings (gear) dropdown.
  // Opening it and switching to Advanced reveals the advanced sections + the
  // floating "Advanced mode" FAB; switching back hides them.
  await expect(page.getByTestId('page-hero')).toBeVisible({ timeout: 15000 })
  const fab = page.locator('.advanced-fab')
  await expect(fab).toHaveCount(0)

  // Open the gear; the toggle lives inside and the popover stays open while you
  // click within it.
  await page.locator('.settings-trigger').click()
  await page.getByRole('button', { name: 'Advanced', exact: true }).click()
  await expect(fab).toBeVisible()
  await expect(page.locator('.overview-group').first()).toBeVisible()

  await page.getByRole('button', { name: 'Simple', exact: true }).click()
  await expect(fab).toHaveCount(0)
})

test('header stat cards share a uniform height', async ({ page, isMobile }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  // On desktop the four cards sit in one row and must match height; on mobile
  // they wrap to two rows of two, so cross-row equality doesn't apply.
  test.skip(isMobile, 'single-row check is desktop-only')
  await expect(page.getByTestId('page-hero')).toBeVisible({ timeout: 15000 })
  const tiles = page.locator('.header-stat-tile')
  await expect(tiles.first()).toBeVisible()
  const heights = await tiles.evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)))
  expect(heights.length).toBeGreaterThanOrEqual(4)
  // All four cards on the top row must be the same height (no ragged row).
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(2)
})

test('dashboard loads data and is not stuck in the empty/loading state', async ({ page }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  // Regression guard for the auth-deadlock / blank-dashboard bug: an
  // authenticated user with matches logged must reach the real overview,
  // never the "No matches yet" empty state or a stuck skeleton.
  // Wait for the overview to settle out of its loading skeleton.
  await expect(page.getByTestId('page-hero')).toBeVisible({ timeout: 15000 })
  // The test user is seeded with matches, so the empty state must be absent.
  await expect(page.getByText(/no matches yet/i)).toHaveCount(0)
  // And a real stat tile must render (header stats are always present once
  // matches load), proving the enrichment queries resolved.
  await expect(page.getByTestId('pitch-insights-passes')).toBeVisible({ timeout: 15000 })
})

test('mode switcher toggles between Matches and Training', async ({ page }) => {
  const authed = await gotoDashboard(page)
  test.skip(!authed, 'requires authenticated test user')
  const switcher = page.getByTestId('mode-switcher')
  await expect(switcher).toBeVisible()

  // Switch to Training: the tab set + content reshape.
  await page.getByTestId('mode-training').click()
  await expect(page.getByTestId('mode-training')).toHaveClass(/is-active/)
  await expect(page.getByTestId('training-overview')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Drills' })).toBeVisible()

  // Back to Matches.
  await page.getByTestId('mode-matches').click()
  await expect(page.getByTestId('mode-matches')).toHaveClass(/is-active/)
  await expect(page.getByRole('button', { name: 'Matches' })).toBeVisible()
})

test('deep-link ?mode=training opens Training mode', async ({ page }) => {
  await page.goto('/dashboard?mode=training')
  await page.waitForLoadState('networkidle')
  test.skip(page.url().includes('/login'), 'requires authenticated test user')
  const skip = page.getByTestId('intro-skip')
  if (await skip.isVisible().catch(() => false)) await skip.click()
  await expect(page.getByTestId('mode-training')).toHaveClass(/is-active/)
  await expect(page.getByTestId('training-overview')).toBeVisible()
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
