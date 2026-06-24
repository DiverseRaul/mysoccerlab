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

  // The WebGL aurora backdrop fills the hero on every viewport (with a CSS
  // gradient fallback when WebGL is unavailable, so the element is always there).
  await expect(page.locator('.hero__shader')).toBeVisible()
})

test('losing the WebGL context falls back to the gradient, never the gray placeholder', async ({ page }) => {
  // Regression: leaving Home (route-leave transition) released the GL context
  // while the canvas was still painted, flashing the browser's gray "context
  // lost" placeholder (a sad-face / broken-image box) for a frame or two.
  // HeroShader now catches webglcontextlost and swaps to the CSS fallback, so
  // the canvas is hidden and the on-brand gradient shows instead of gray.
  const shader = page.locator('.heroshader')
  await expect(shader).toBeVisible()

  const result = await page.evaluate(() => {
    const canvas = document.querySelector('.heroshader__canvas')
    const gl = canvas?.getContext('webgl') || canvas?.getContext('experimental-webgl')
    const ext = gl?.getExtension('WEBGL_lose_context')
    if (!ext) return 'no-webgl' // WebGL unavailable: fallback already active
    ext.loseContext()
    return 'lost'
  })

  if (result === 'lost') {
    // Handler runs and the canvas is taken out of the paint path.
    await expect(shader).toHaveClass(/heroshader--fallback/)
    await expect(page.locator('.heroshader__canvas')).toBeHidden()
  } else {
    // No WebGL in this environment — the gradient fallback is the rendered state.
    await expect(shader).toHaveClass(/heroshader--fallback/)
  }
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

  // The showcase is scroll-driven (pinned). At the top of the section the first
  // card is active; arrows/dots scroll the page to a card and update the dots.
  const dots = page.getByTestId('carousel-dot')
  const dotCount = await dots.count()
  expect(dotCount).toBeGreaterThanOrEqual(5)
  await expect(dots.nth(0)).toHaveAttribute('aria-selected', 'true')

  // Next arrow advances the active card/dot.
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

test('mobile bottom nav: Phosphor icons, real outline→fill swap, liquid indicator on active', async ({ page }) => {
  const vp = page.viewportSize()
  const isMobile = !!vp && vp.width <= 1024
  test.skip(!isMobile, 'bottom nav only renders on mobile/tablet')

  const nav = page.getByTestId('bottom-nav')
  await expect(nav).toBeVisible()

  // Icons are a comfortable, legible size (24px in CSS).
  const iconFontSize = await nav.locator('.bn-tab .bn-ico').first().evaluate(
    (el) => getComputedStyle(el).fontSize
  )
  expect(parseFloat(iconFontSize)).toBeGreaterThanOrEqual(22)

  // On "/" the Home tab is active; compare it against an inactive tab.
  const active = nav.locator('.bn-tab.router-link-active')
  await expect(active).toBeVisible()
  const inactive = nav.locator('.bn-tab:not(.router-link-active)').first()

  // Genuine fill swap: the active tab shows the SOLID (-fill) glyph and hides
  // the outline (-line); an inactive tab does the inverse. (display, so this is
  // robust even before the icon webfont has painted.)
  const activeDisp = await active.evaluate((el) => ({
    line: getComputedStyle(el.querySelector('.bn-ico:not(.bn-ico--fill)')).display,
    fill: getComputedStyle(el.querySelector('.bn-ico--fill')).display,
  }))
  expect(activeDisp.line).toBe('none')
  expect(activeDisp.fill).not.toBe('none')

  const inactiveDisp = await inactive.evaluate((el) => ({
    line: getComputedStyle(el.querySelector('.bn-ico:not(.bn-ico--fill)')).display,
    fill: getComputedStyle(el.querySelector('.bn-ico--fill')).display,
  }))
  expect(inactiveDisp.line).not.toBe('none')
  expect(inactiveDisp.fill).toBe('none')

  // Active icon/label take on the app accent color (distinct from inactive).
  const activeColor = await active.evaluate((el) => getComputedStyle(el).color)
  const inactiveColor = await inactive.evaluate((el) => getComputedStyle(el).color)
  expect(activeColor).not.toBe(inactiveColor)

  // The liquid-glass indicator is shown and parked behind the active tab
  // (its horizontal centre lines up with the active tab's centre).
  const indicator = nav.locator('.bn-indicator')
  await expect(indicator).toBeVisible()
  const indBox = await indicator.boundingBox()
  const activeBox = await active.boundingBox()
  expect(indBox).not.toBeNull()
  expect(activeBox).not.toBeNull()
  const indCenter = indBox.x + indBox.width / 2
  const activeCenter = activeBox.x + activeBox.width / 2
  expect(Math.abs(indCenter - activeCenter)).toBeLessThanOrEqual(8)
})

test('homepage does not overflow horizontally', async ({ page }) => {
  await page.waitForLoadState('networkidle')
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement
    return el.scrollWidth - el.clientWidth
  })
  expect(overflow).toBeLessThanOrEqual(1)
})

test('a fresh navigation lands at the top of the next page (no inherited scroll)', async ({ page }) => {
  // Regression: routing kept the previous page's scroll offset, so scrolling to
  // the bottom of Home and then opening another page left you partway down that
  // page instead of at its top. The router's scrollBehavior now resets to top on
  // forward navigations (and only restores position on browser back/forward).
  await page.waitForLoadState('networkidle')
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(150)
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(50)

  // Click an in-app router-link (SPA navigation — this is what exercises the
  // router's scrollBehavior; a full page load would reset to top regardless).
  // The nav's "Login" link is fixed/always-actionable on both viewports, and
  // clicking it doesn't move our scroll position before navigating. (exact:true
  // so it doesn't also match the hero's "Log in" CTA.)
  await page.getByRole('link', { name: 'Login', exact: true }).click()
  await page.waitForURL('**/login')
  // Give the route-splash transition + scrollBehavior time to settle.
  await page.waitForTimeout(500)
  expect(await page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(2)
})
