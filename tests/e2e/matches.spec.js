import { test, expect } from '@playwright/test'

/**
 * Match-area E2E coverage. The screens we changed:
 *   - MatchList card visual overhaul (accent stripe, top-stat chip, sparkline)
 *   - Stat-controls grid in the live editor
 *   - Season selector pill restyled to match tab buttons
 *   - ShareMatchModal: caption + layout variants + copy-as-text
 *
 * The matches list itself requires auth, so tests here split into:
 *   - Auth-free runtime checks (no errors, dropdowns dark) using the login route
 *   - Full UI assertions are wrapped in test.describe('authenticated', ...)
 *     and skipped when storageState isn't configured.
 */

const isAuthConfigured = () => {
  // global-setup writes tests/.auth/user.json only when VITE_TEST_EMAIL is set.
  // Skip the authenticated suite when the file is absent so smoke remains green.
  try {
    require('node:fs').accessSync('tests/.auth/user.json')
    return true
  } catch {
    return false
  }
}

test('match utilities load without runtime errors', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  expect(errors, errors.join('\n')).toHaveLength(0)
})

test.describe('authenticated', () => {
  test.skip(!isAuthConfigured(), 'auth state not configured — see tests/README.md')

  test('match list cards expose data-result for accent stripe', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Matches' }).click()
    const firstCard = page.locator('.match-card--row').first()
    await expect(firstCard).toBeVisible()
    const result = await firstCard.getAttribute('data-result')
    expect(['W', 'D', 'L']).toContain(result)
  })

  test('top-stat chip renders for matches with notable stats', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Matches' }).click()
    // At least one card should have the chip among the seeded test data.
    await expect(page.locator('.match-card__chip').first()).toBeVisible()
  })

  test('result filter pills narrow the list', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Matches' }).click()
    const initialCount = await page.locator('.match-card--row').count()
    await page.locator('.filter-pill[data-filter="W"]').click()
    const winCount = await page.locator('.match-card--row').count()
    expect(winCount).toBeLessThanOrEqual(initialCount)
    // every visible card after filtering must be a win
    const results = await page.locator('.match-card--row').evaluateAll(els =>
      els.map(el => el.getAttribute('data-result'))
    )
    expect(results.every(r => r === 'W')).toBe(true)
  })

  test('live match editor stat controls render in a grid on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop grid only')
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Matches' }).click()
    await page.locator('.match-card--row').first().click()
    const grid = page.locator('.live-match-controls').first()
    await expect(grid).toBeVisible()
    const gridDisplay = await grid.evaluate(el => getComputedStyle(el).display)
    expect(gridDisplay).toBe('grid')
  })

  test('share modal: caption persists, layout variants swap, copy summary works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Matches' }).click()
    await page.locator('.match-card--row').first().click()
    await page.getByRole('button', { name: /share/i }).click()

    const caption = page.locator('#share-caption')
    await caption.fill('test caption')
    await expect(caption).toHaveValue('test caption')

    // Layout variants swap the share-card class
    await page.locator('.layout-btn[data-layout="score"]').click()
    await expect(page.locator('#share-card')).toHaveClass(/share-card--score/)

    await page.locator('.layout-btn[data-layout="story"]').click()
    await expect(page.locator('#share-card')).toHaveClass(/share-card--story/)

    // Copy summary uses navigator.clipboard — stub it and verify the call
    await page.evaluate(() => {
      window.__copied = ''
      navigator.clipboard.writeText = async (txt) => { window.__copied = txt }
    })
    await page.getByRole('button', { name: /copy summary/i }).click()
    const copied = await page.evaluate(() => window.__copied)
    expect(copied).toContain('test caption')
    expect(copied).toContain('#mysoccerlab')
  })
})
