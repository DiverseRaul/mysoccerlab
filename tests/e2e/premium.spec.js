import { test, expect } from '@playwright/test'

/**
 * Lab Pro (Premium) page — reworked to match the Home UI: clean hero, a feature
 * bento, live showcase demos, a pricing slider, and scroll-driven motion.
 *
 * The route is auth-gated (redirects to /login when signed out), so these run
 * under the chromium-auth-* projects. When no test user is configured the route
 * redirects and the tests skip, keeping the suite green.
 */

async function gotoPremium(page) {
  await page.goto('/premium')
  await page.waitForLoadState('networkidle')
  return !page.url().includes('/login')
}

test('premium hero renders the title and badge', async ({ page }) => {
  const authed = await gotoPremium(page)
  test.skip(!authed, 'requires authenticated test user')
  const title = page.locator('h1.prem-hero__title')
  await expect(title).toBeVisible()
  await expect(title).not.toBeEmpty()
})

test('premium shows the feature bento and showcase demos', async ({ page }) => {
  const authed = await gotoPremium(page)
  test.skip(!authed, 'requires authenticated test user')
  await expect(page.getByTestId('premium-bento')).toBeVisible()
  // Five Pro features as bento tiles.
  await expect(page.locator('[data-testid="premium-bento"] .bento__tile')).toHaveCount(5)
  // At least one live showcase card.
  await expect(page.locator('.show-card').first()).toBeVisible()
})

test('the accent customizer recolours the demo card', async ({ page }) => {
  const authed = await gotoPremium(page)
  test.skip(!authed, 'requires authenticated test user')
  const swatches = page.locator('.demo-accent__swatch')
  await expect(swatches.first()).toBeVisible()
  // Pick the second preset swatch and confirm it becomes active.
  await swatches.nth(1).click()
  await expect(swatches.nth(1)).toHaveClass(/is-active/)
})

test('choosing a plan updates the per-month price', async ({ page }) => {
  const authed = await gotoPremium(page)
  test.skip(!authed, 'requires authenticated test user')
  const amount = page.locator('.prem-price__amount')
  await expect(amount).toBeVisible()
  // Exactly three fixed plans: monthly / quarterly / yearly.
  const planTabs = page.locator('.prem-plan')
  await expect(planTabs).toHaveCount(3)
  const yearly = await amount.textContent()
  // Switch to the monthly plan — the cheapest-per-month yearly default should change.
  await planTabs.first().click()
  await expect(planTabs.first()).toHaveClass(/is-active/)
  await expect(amount).not.toHaveText(yearly)
})

test('premium page does not overflow horizontally on mobile', async ({ page, isMobile }) => {
  const authed = await gotoPremium(page)
  test.skip(!authed, 'requires authenticated test user')
  test.skip(!isMobile, 'mobile overflow check')
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(1)
})
