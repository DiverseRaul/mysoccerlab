import { test, expect } from '@playwright/test'

/**
 * The coach/scout share page is PUBLIC (no auth). A bad/disabled token must
 * render a friendly "unavailable" state — never redirect to /login or crash.
 */

test('share page is public and handles a bad token gracefully', async ({ page }) => {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))

  await page.goto('/share/definitely-not-a-real-token')
  await page.waitForLoadState('networkidle')

  // Must NOT bounce to login — this route is public.
  expect(page.url()).not.toMatch(/\/login/)
  expect(page.url()).toMatch(/\/share\//)
  // No uncaught runtime errors.
  expect(errors, `Runtime errors: ${errors.join('\n')}`).toHaveLength(0)
})
