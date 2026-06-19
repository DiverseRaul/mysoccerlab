import { test, expect } from '@playwright/test'

/**
 * Auth-free coverage for the dark landing page (hero + scroll-animated info).
 * Runs on chromium-desktop and chromium-mobile. Reduced motion is emulated so
 * the carousel autoplay is off (deterministic) and scroll-zoom is static.
 * Assertions are copy-agnostic (headline/CTA copy is admin-editable) and
 * DOM-based (the decoration is plain SVG — no WebGL).
 */

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
})

test('hero headline and per-viewport chrome render', async ({ page }) => {
  const h1 = page.locator('h1.hero__title')
  await expect(h1).toBeVisible()
  await expect(h1).not.toHaveText('')

  const vp = page.viewportSize()
  if (vp && vp.width <= 1024) {
    // Mobile: animated wave hero banner at the top.
    await expect(page.locator('.hero__wave')).toBeVisible()
  } else {
    // Desktop: abstract side decoration.
    await expect(page.getByTestId('hero-decor')).toBeVisible()
  }
})

test('mobile hero wave fades on the stationary container and overscans the moving field', async ({ page }) => {
  const vp = page.viewportSize()
  test.skip(!vp || vp.width > 1024, 'wave hero is mobile-only')

  const wave = page.locator('.herowave')
  const field = page.locator('.herowave__field')
  await expect(wave).toBeVisible()

  // The soft fade must live on the stationary container, not the moving field —
  // a mask on the transformed field drags its solid edge into view as a hard
  // line when the scroll-driven transform kicks in.
  const waveMask = await wave.evaluate((el) => {
    const s = getComputedStyle(el)
    return s.maskImage !== 'none' ? s.maskImage : s.webkitMaskImage
  })
  expect(waveMask).toContain('gradient')

  const fieldMask = await field.evaluate((el) => {
    const s = getComputedStyle(el)
    const m = s.maskImage !== 'none' ? s.maskImage : s.webkitMaskImage
    return m || 'none'
  })
  expect(fieldMask).toBe('none')

  // The field must overscan its container on every side so the parallax /
  // zoom / tilt never bares a field edge inside the clipped container.
  const boxes = await page.evaluate(() => {
    const c = document.querySelector('.herowave').getBoundingClientRect()
    const f = document.querySelector('.herowave__field').getBoundingClientRect()
    return { c, f }
  })
  expect(boxes.f.top).toBeLessThan(boxes.c.top)
  expect(boxes.f.bottom).toBeGreaterThan(boxes.c.bottom)
  expect(boxes.f.left).toBeLessThan(boxes.c.left)
  expect(boxes.f.right).toBeGreaterThan(boxes.c.right)
})

test('primary CTA is reachable in the first viewport', async ({ page }) => {
  const cta = page.locator('a[href="/signup"]').filter({ has: page.locator('.cta-box__arrow') }).first()
  await expect(cta).toBeVisible()
  await expect(cta).toBeInViewport()
})

test('feature carousel renders and is interactive', async ({ page }) => {
  // Wait for admin content to load so the carousel doesn't re-render mid-click.
  await page.waitForLoadState('networkidle')
  const carousel = page.getByTestId('feature-carousel')
  await carousel.scrollIntoViewIfNeeded()
  await expect(carousel).toBeVisible()
  // Hovering pauses autoplay so the dot assertions below are deterministic.
  await carousel.hover()

  const dots = page.getByTestId('carousel-dot')
  const dotCount = await dots.count()
  expect(dotCount).toBeGreaterThanOrEqual(5)
  await expect(dots.nth(0)).toHaveAttribute('aria-selected', 'true')

  // Next arrow advances the active slide/dot.
  await page.getByRole('button', { name: /next feature/i }).click()
  await expect(dots.nth(1)).toHaveAttribute('aria-selected', 'true')
  await expect(dots.nth(0)).toHaveAttribute('aria-selected', 'false')

  // Clicking a dot jumps to it.
  await dots.nth(3).click()
  await expect(dots.nth(3)).toHaveAttribute('aria-selected', 'true')
})

test('bento grid renders', async ({ page }) => {
  await expect(page.getByTestId('bento-grid')).toBeVisible()
})

test('primary navigation matches the viewport (top on desktop, floating bottom on mobile)', async ({ page }) => {
  const vp = page.viewportSize()
  const isMobile = !!vp && vp.width <= 1024
  if (isMobile) {
    await expect(page.getByTestId('bottom-nav')).toBeVisible()
    await expect(page.locator('.navbar')).toBeHidden()
  } else {
    await expect(page.locator('.desktop-links')).toBeVisible()
    await expect(page.getByTestId('bottom-nav')).toBeHidden()
  }
})

test('homepage does not overflow horizontally', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(1)
})
