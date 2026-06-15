import { test, expect } from '@playwright/test'

/**
 * Map-first match event logging (MatchMapLogger):
 *   - Counters / Map toggle in the live match view
 *   - Tap pitch -> EventRadialMenu -> pick action -> pin + summary increments
 *   - Tap pin -> DeleteLogTooltip -> delete -> pin removed + summary decrements
 *
 * Authenticated flow (needs a seeded match); skipped when storageState is absent
 * so the smoke floor stays green. Logging a tackle then deleting it nets zero,
 * leaving seeded data unchanged.
 */

const isAuthConfigured = () => {
  try {
    require('node:fs').accessSync('tests/.auth/user.json')
    return true
  } catch {
    return false
  }
}

async function openFirstMatch(page) {
  await page.goto('/dashboard')
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) return false
  await page.getByRole('button', { name: 'Matches' }).click()
  const firstCard = page.locator('.match-card--row').first()
  if (!(await firstCard.count())) return false
  await firstCard.click()
  return true
}

test('match map logger module loads without runtime errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(errors, errors.join('\n')).toHaveLength(0)
})

test.describe('authenticated', () => {
  test.skip(!isAuthConfigured(), 'auth state not configured — see tests/README.md')

  test('Counters / Map toggle swaps the logging surface', async ({ page }) => {
    const opened = await openFirstMatch(page)
    test.skip(!opened, 'requires authenticated test user with a seeded match')

    await page.getByTestId('logger-view-map').click()
    await expect(page.getByTestId('match-map-logger')).toBeVisible()
    await expect(page.getByTestId('event-summary-panel')).toBeVisible()
    await expect(page.getByTestId('quick-log-controls')).toBeVisible()

    await page.getByTestId('logger-view-counters').click()
    await expect(page.locator('.live-match-controls').first()).toBeVisible()
    await expect(page.getByTestId('match-map-logger')).toHaveCount(0)
  })

  test('tap pitch logs a tackle pin and deleting it reverses the count', async ({ page }) => {
    const opened = await openFirstMatch(page)
    test.skip(!opened, 'requires authenticated test user with a seeded match')

    await page.getByTestId('logger-view-map').click()
    const canvas = page.locator('.match-map-logger__canvas')
    await expect(canvas).toBeVisible()

    const summary = page.getByTestId('event-summary-tackles')
    const before = parseInt((await summary.textContent()).trim(), 10)
    const pinsBefore = await page.getByTestId('logged-event-pin').count()

    const box = await canvas.boundingBox()
    await canvas.click({ position: { x: box.width * 0.35, y: box.height * 0.55 } })

    await expect(page.getByTestId('event-radial-menu')).toBeVisible()
    await page.getByTestId('event-action-tackles').click()

    await expect(page.getByTestId('logged-event-pin')).toHaveCount(pinsBefore + 1)
    await expect(summary).toHaveText(String(before + 1))

    const newPin = page.getByTestId('logged-event-pin').last()
    await newPin.click()

    const tooltip = page.getByTestId('delete-log-tooltip')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('Tackle')

    await page.getByTestId('delete-log-button').click()

    await expect(page.getByTestId('logged-event-pin')).toHaveCount(pinsBefore)
    await expect(summary).toHaveText(String(before))
  })

  test('radial menu cancels without logging', async ({ page }) => {
    const opened = await openFirstMatch(page)
    test.skip(!opened, 'requires authenticated test user with a seeded match')

    await page.getByTestId('logger-view-map').click()
    const canvas = page.locator('.match-map-logger__canvas')
    const pinsBefore = await page.getByTestId('logged-event-pin').count()

    const box = await canvas.boundingBox()
    await canvas.click({ position: { x: box.width * 0.5, y: box.height * 0.4 } })
    await expect(page.getByTestId('event-radial-menu')).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByTestId('event-radial-menu')).toHaveCount(0)
    await expect(page.getByTestId('logged-event-pin')).toHaveCount(pinsBefore)
  })

  test('map logger does not overflow horizontally on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile layout only')
    const opened = await openFirstMatch(page)
    test.skip(!opened, 'requires authenticated test user with a seeded match')

    await page.getByTestId('logger-view-map').click()
    await expect(page.getByTestId('match-map-logger')).toBeVisible()
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement
      return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
