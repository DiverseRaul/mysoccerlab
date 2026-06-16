import { test, expect } from '@playwright/test'

/**
 * Auth-free coverage for the slideshow-style feature-story homepage.
 * Runs on chromium-desktop and chromium-mobile. Reduced motion is emulated so
 * the slideshow auto-advance is disabled (deterministic) and the reveal
 * wrappers fade in without movement.
 */

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
})

test('hero and feature slideshow render', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: /your season/i })).toBeVisible()
  await expect(page.getByTestId('feature-slideshow')).toBeVisible()
  // First slide's copy is the active one shown.
  await expect(page.getByRole('heading', { name: /every touch, mapped/i })).toBeVisible()
  // One dot per feature slide (the feature set is admin-editable content, so
  // assert the dots match the rendered slides rather than a hard-coded number).
  const slideCount = await page.locator('.slide').count()
  expect(slideCount).toBeGreaterThanOrEqual(5)
  await expect(page.getByTestId('slide-dot')).toHaveCount(slideCount)
})

test('slideshow advances via the next arrow', async ({ page }) => {
  const dots = page.getByTestId('slide-dot')
  await expect(dots.nth(0)).toHaveAttribute('aria-selected', 'true')

  await page.getByRole('button', { name: /next feature/i }).click()
  await expect(dots.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(dots.nth(0)).toHaveAttribute('aria-selected', 'false')
})

test('slideshow jumps when a dot is clicked', async ({ page }) => {
  const dots = page.getByTestId('slide-dot')
  await dots.nth(3).click()
  await expect(dots.nth(3)).toHaveAttribute('aria-selected', 'true')
})

test('primary CTA is reachable in the first viewport', async ({ page }) => {
  const cta = page.getByRole('link', { name: /start your season/i }).first()
  await expect(cta).toBeVisible()
  await expect(cta).toBeInViewport()
})

test('homepage does not overflow horizontally', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(1)
})
