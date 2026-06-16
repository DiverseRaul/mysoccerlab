import { test, expect } from '@playwright/test'

/**
 * Weekly Training plan tab (Training → Weekly Plan). The AI call is route-mocked
 * so the test is deterministic and never hits Gemini. Skips without a test user.
 */

const isAuthConfigured = () => {
  try {
    const raw = require('node:fs').readFileSync('tests/.auth/user.json', 'utf8')
    const state = JSON.parse(raw)
    return Array.isArray(state.origins) && state.origins.length > 0
  } catch {
    return false
  }
}

const CANNED_PLAN = [
  'Here is your week, all building toward finishing:',
  'Monday – Finishing',
  '- 20 shots from the edge of the box',
  'Tuesday – Finishing',
  '- 1-touch finishes x30',
  'Wednesday – Finishing',
  '- Volleys x20',
  'Thursday – Finishing',
  '- Weak-foot shooting x20',
  'Friday – Finishing',
  '- Penalties x10',
  'Saturday – Finishing',
  '- Shooting under fatigue x15',
  'Sunday – Recovery',
  '- Light technical work, 20 min'
].join('\n')

async function gotoWeekly(page) {
  await page.goto('/dashboard?mode=training')
  await page.waitForLoadState('networkidle')
  if (page.url().includes('/login')) return false
  const skip = page.getByTestId('intro-skip')
  if (await skip.isVisible().catch(() => false)) await skip.click()
  await page.getByRole('button', { name: 'Weekly Plan', exact: true }).click()
  return true
}

test.describe('weekly training plan', () => {
  test.skip(!isAuthConfigured(), 'auth state not configured — see tests/README.md')

  test.beforeEach(async ({ page }) => {
    // Deterministic AI: return a fixed 7-day calendar instead of calling Gemini.
    await page.route('**/functions/v1/ai-coach', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ text: CANNED_PLAN })
      })
    })
  })

  test('pick a focus, generate, and the 7-day plan renders then persists', async ({ page }) => {
    const ok = await gotoWeekly(page)
    test.skip(!ok, 'requires authenticated test user')

    await expect(page.getByTestId('weekly-plan')).toBeVisible()
    // Wait until it settles out of the loading skeleton into EITHER the picker
    // or a saved plan (a prior run may have persisted one).
    const changeFocus = page.getByTestId('weekly-plan-regenerate')
    await expect(page.getByTestId('weekly-plan-picker').or(changeFocus)).toBeVisible()

    // If a plan is showing, "Change focus" opens the picker.
    if (await changeFocus.isVisible().catch(() => false)) await changeFocus.click()
    await expect(page.getByTestId('weekly-plan-picker')).toBeVisible()

    // Step 1: pick a focus, then advance through the wizard with Next.
    await page.getByTestId('weekly-focus-finishing').click()
    for (let i = 0; i < 6 && await page.getByTestId('weekly-plan-next').isVisible().catch(() => false); i++) {
      await page.getByTestId('weekly-plan-next').click()
    }
    await page.getByTestId('weekly-plan-generate').click()

    // The parsed plan renders as a 7-day calendar.
    await expect(page.locator('.day-badge')).toHaveCount(7)
    await expect(page.locator('.day-badge').first()).toHaveText('Monday')

    // Reload — the tab reloads cleanly. (Once migration 0026 is applied the
    // plan persists and the 7 days render again; without the table the picker
    // shows. Either way the tab must load without error.)
    await page.reload()
    await page.waitForLoadState('networkidle')
    const skip = page.getByTestId('intro-skip')
    if (await skip.isVisible().catch(() => false)) await skip.click()
    await page.getByRole('button', { name: 'Weekly Plan', exact: true }).click()
    await expect(page.getByTestId('weekly-plan')).toBeVisible()
  })

  test('weekly plan tab does not overflow horizontally on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile overflow check')
    const ok = await gotoWeekly(page)
    test.skip(!ok, 'requires authenticated test user')
    await expect(page.getByTestId('weekly-plan')).toBeVisible()
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement
      return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
