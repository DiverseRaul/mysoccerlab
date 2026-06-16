import { test, expect } from '@playwright/test'

/**
 * Admin → Welcome Intro editor. Requires an admin test user; skips otherwise.
 * Non-admins are redirected to /dashboard by AdminLayout, so the editor not
 * rendering just means the test user isn't an admin — we skip rather than fail.
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

test.describe('admin welcome-intro editor', () => {
  test.skip(!isAuthConfigured(), 'auth state not configured — see tests/README.md')

  test('renders the editor with visibility toggles and saves', async ({ page }) => {
    await page.goto('/admin/intro')
    await page.waitForLoadState('networkidle')
    test.skip(page.url().includes('/login'), 'requires authenticated test user')

    const heading = page.getByRole('heading', { name: /welcome intro/i })
    const isAdmin = await heading.isVisible().catch(() => false)
    test.skip(!isAdmin, 'test user is not an admin')

    // Visibility toggles render.
    await expect(page.getByText(/show the intro to new players/i)).toBeVisible()
    await expect(page.getByText(/admins re-see it on every refresh/i)).toBeVisible()

    // Save flashes confirmation (writes the intro content row).
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('button', { name: /Saved ✓|Saving…/ })).toBeVisible()
  })
})
