import { test, expect } from '@playwright/test'

/**
 * Overhauled Feed coverage: glassy feed cards stack vertically, the scrollable
 * tab row switches Following/Explore without overflowing, the Find Players
 * modal opens, and the page never overflows horizontally on mobile.
 *
 * Needs an authenticated session (tests/global-setup.js + .env.test). Without
 * a test user the route redirects to /login and these skip.
 */

async function gotoFeed(page) {
  await page.goto('/feed')
  await page.waitForLoadState('networkidle')
  return !page.url().includes('/login')
}

test('feed tab row fits the viewport', async ({ page }) => {
  const authed = await gotoFeed(page)
  test.skip(!authed, 'requires authenticated test user')
  const tabs = page.getByTestId('scrollable-tabs').first()
  await expect(tabs).toBeVisible()
  const fitsViewport = await tabs.evaluate((el) => {
    return Math.ceil(el.getBoundingClientRect().right) <= window.innerWidth + 1
  })
  expect(fitsViewport).toBe(true)
})

test('feed tabs switch between Following and Explore', async ({ page }) => {
  const authed = await gotoFeed(page)
  test.skip(!authed, 'requires authenticated test user')
  await page.getByRole('button', { name: 'Explore' }).click()
  await expect(page.getByRole('button', { name: 'Explore' })).toHaveClass(/is-active/)
})

test('find players modal opens', async ({ page }) => {
  const authed = await gotoFeed(page)
  test.skip(!authed, 'requires authenticated test user')
  await page.locator('.btn-icon').first().click()
  await expect(page.getByRole('heading', { name: /find players/i })).toBeVisible()
})

test('feed does not overflow horizontally on mobile', async ({ page, isMobile }) => {
  const authed = await gotoFeed(page)
  test.skip(!authed, 'requires authenticated test user')
  test.skip(!isMobile, 'mobile overflow check')
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(1)
})

test('practice activity card renders its training tag when present', async ({ page }) => {
  const authed = await gotoFeed(page)
  test.skip(!authed, 'requires authenticated test user')
  // Practice cards only appear when a followed/public player has training logged
  // (the feed excludes your own activity), so this is conditional like the
  // match-card test — it documents the merged timeline without requiring seed.
  await page.getByRole('button', { name: 'Explore' }).click()
  await page.waitForLoadState('networkidle')
  const card = page.getByTestId('practice-feed-card').first()
  const hasCard = await card.isVisible().catch(() => false)
  test.skip(!hasCard, 'no public practice activity for this test user')
  await expect(card.getByTestId('practice-feed-author')).toBeVisible()
  await expect(card).toContainText(/Training|PB/)
})

test('match report card shows the stats hero and a working shot-map toggle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const authed = await gotoFeed(page)
  test.skip(!authed, 'requires authenticated test user')

  const card = page.getByTestId('feed-card').first()
  const hasCard = await card.isVisible().catch(() => false)
  test.skip(!hasCard, 'no matches in feed for this test user')

  // Layer 2: the Stats hero is the centerpiece.
  await expect(card.getByTestId('match-hero')).toBeVisible()

  // Layer 3: the shot-map toggle is present, a real tap target, and collapsed
  // by default (cards stay compact; data is batch-loaded so expanding is instant).
  const toggle = card.getByTestId('feed-shotmap-toggle')
  await expect(toggle).toBeVisible()
  const box = await toggle.boundingBox()
  expect(box.height).toBeGreaterThanOrEqual(44)
  await expect(card.getByTestId('feed-shotmap')).toHaveCount(0)

  // Expanding reveals the map region (heatmap of all actions, shots below).
  await toggle.click()
  await expect(card.getByTestId('feed-shotmap')).toBeVisible()
  await expect(toggle).toHaveText(/hide heatmap/i)

  // Collapsing hides it again.
  await toggle.click()
  await expect(toggle).toHaveText(/view heatmap/i)
})
