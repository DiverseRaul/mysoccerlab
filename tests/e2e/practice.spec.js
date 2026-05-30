import { test, expect } from '@playwright/test'

/**
 * Practice tracker E2E coverage.
 *
 * Auth-free checks confirm the dashboard route is gated. Authenticated
 * checks exercise the full drill lifecycle (create → log → trend → edit
 * → delete). Skipped automatically when storageState isn't configured,
 * mirroring matches.spec.js.
 */

const isAuthConfigured = () => {
  try {
    require('node:fs').accessSync('tests/.auth/user.json')
    return true
  } catch {
    return false
  }
}

test('practice tab boots without runtime errors (logged-out redirect)', async ({ page }) => {
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/dashboard')
  // unauthenticated dashboard redirects to /login per Dashboard.vue onMounted
  await page.waitForURL(/\/login/, { timeout: 5000 })
  expect(errors, errors.join('\n')).toHaveLength(0)
})

test.describe('authenticated', () => {
  test.skip(!isAuthConfigured(), 'auth state not configured — see tests/README.md')

  // Use a unique drill name per test run so leftover rows don't break assertions.
  const drillNameFor = (label) => `${label} ${Date.now().toString().slice(-6)}`

  test('Practice tab renders and shows drill list or empty state', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await expect(page.getByTestId('practice-drill-list')).toBeVisible()
  })

  test('create a count drill, log two sessions, see chart + PB + trend', async ({ page }) => {
    const name = drillNameFor('Juggles')

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await page.getByTestId('practice-add-drill-btn').click()
    await expect(page.getByTestId('practice-add-drill-modal')).toBeVisible()

    await page.getByTestId('drill-name-input').fill(name)
    await page.getByTestId('drill-type-input').selectOption('count')
    await page.getByTestId('drill-unit-input').fill('juggles')
    await page.getByTestId('drill-submit-btn').click()

    // The new card appears in the list.
    const card = page.getByRole('button').filter({ hasText: name }).first()
    await expect(card).toBeVisible()

    // Open detail view.
    await card.click()
    await expect(page.getByTestId('practice-drill-detail')).toBeVisible()
    await expect(page.getByRole('heading', { name })).toBeVisible()

    // Log first session: 40 juggles, 2026-05-01
    await page.getByTestId('practice-log-session-btn').click()
    await expect(page.getByTestId('practice-log-session-modal')).toBeVisible()
    await page.locator('input[type="date"]').fill('2026-05-01')
    await page.getByTestId('session-primary-input').fill('40')
    await page.getByTestId('session-submit-btn').click()

    // Log second session: 60 juggles, 2026-07-01
    await page.getByTestId('practice-log-session-btn').click()
    await page.locator('input[type="date"]').fill('2026-07-01')
    await page.getByTestId('session-primary-input').fill('60')
    await page.getByTestId('session-submit-btn').click()

    // Latest KPI = 60, PB KPI = 60.
    await expect(page.getByText('60 juggles').first()).toBeVisible()

    // Chart rendered with at least 2 points (svg circles).
    await expect(page.getByTestId('practice-line-chart').locator('circle')).toHaveCount(2)

    // Session log table shows two rows.
    await expect(page.locator('tbody tr')).toHaveCount(2)

    // Cleanup: delete the drill so the test is repeatable.
    await page.getByRole('button', { name: 'Delete' }).click()
    page.once('dialog', (d) => d.accept()) // safety, though we use a custom modal
    await page.getByTestId('confirm-delete-drill-btn').click()
    await expect(page.getByText(name)).toBeHidden()
  })

  test('ratio drill renders made/attempted with accuracy percentage', async ({ page }) => {
    const name = drillNameFor('Shots outside box')

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await page.getByTestId('practice-add-drill-btn').click()
    await page.getByTestId('drill-name-input').fill(name)
    await page.getByTestId('drill-type-input').selectOption('ratio')
    await page.getByTestId('drill-unit-input').fill('shots')
    await page.getByTestId('drill-submit-btn').click()

    const card = page.getByRole('button').filter({ hasText: name }).first()
    await card.click()

    await page.getByTestId('practice-log-session-btn').click()
    await page.locator('input[type="date"]').fill('2026-05-01')
    await page.getByTestId('session-primary-input').fill('25')
    await page.getByTestId('session-secondary-input').fill('50')
    await page.getByTestId('session-submit-btn').click()

    await expect(page.getByText('25 / 50 (50%)').first()).toBeVisible()

    // Cleanup
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByTestId('confirm-delete-drill-btn').click()
    await expect(page.getByText(name)).toBeHidden()
  })

  test('shot_map drill: free-place markers on goal, derive goals/shots', async ({ page }) => {
    const name = drillNameFor('Penalty practice')

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await page.getByTestId('practice-add-drill-btn').click()
    await page.getByTestId('drill-name-input').fill(name)
    await page.getByTestId('drill-type-input').selectOption('shot_map')
    await page.getByTestId('drill-unit-input').fill('shots')
    await page.getByTestId('drill-submit-btn').click()

    const card = page.getByRole('button').filter({ hasText: name }).first()
    await card.click()

    await page.getByTestId('practice-log-session-btn').click()
    await page.locator('input[type="date"]').fill('2026-05-15')

    // Goal map is shown by default for shot_map drills.
    const goalMap = page.getByTestId('practice-goal-map')
    await expect(goalMap).toBeVisible()

    const canvas = goalMap.locator('.goal-canvas')
    const box = await canvas.boundingBox()
    if (!box) throw new Error('goal canvas has no bounding box')

    // Two goals inside the goal mouth (which sits in the upper-middle band of the canvas).
    await canvas.click({ position: { x: box.width * 0.4, y: box.height * 0.35 } })
    await canvas.click({ position: { x: box.width * 0.65, y: box.height * 0.45 } })

    // A miss outside the goal frame (lower part of the canvas).
    await page.getByTestId('outcome-pill-miss').click()
    await canvas.click({ position: { x: box.width * 0.2, y: box.height * 0.85 } })

    // 2 goals out of 3 attempts derived.
    await expect(page.locator('.derived-hint')).toContainText('2')
    await expect(page.locator('.derived-hint')).toContainText('3')

    await page.getByTestId('session-submit-btn').click()

    // Detail view: latest reads "2 / 3 (67%)" (rounded display)
    await expect(page.getByText(/2 \/ 3/).first()).toBeVisible()

    // The shot map heatmap renders with 3 markers.
    await expect(
      page.locator('.map-section').getByTestId('practice-goal-map').locator('.marker')
    ).toHaveCount(3)

    // Cleanup
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByTestId('confirm-delete-drill-btn').click()
    await expect(page.getByText(name)).toBeHidden()
  })

  test('shot_map: foot toggle tags markers Left vs Right', async ({ page }) => {
    const name = drillNameFor('Foot map')

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await page.getByTestId('practice-add-drill-btn').click()
    await page.getByTestId('drill-name-input').fill(name)
    await page.getByTestId('drill-type-input').selectOption('shot_map')
    await page.getByTestId('drill-submit-btn').click()

    await page.getByRole('button').filter({ hasText: name }).first().click()
    await page.getByTestId('practice-log-session-btn').click()

    const canvas = page.getByTestId('practice-goal-map').locator('.goal-canvas')
    const box = await canvas.boundingBox()

    // Left foot, place one inside the goal
    await page.getByTestId('foot-pill-left').click()
    await canvas.click({ position: { x: box.width * 0.3, y: box.height * 0.35 } })

    // Right foot, place two more inside the goal
    await page.getByTestId('foot-pill-right').click()
    await canvas.click({ position: { x: box.width * 0.6, y: box.height * 0.4 } })
    await canvas.click({ position: { x: box.width * 0.5, y: box.height * 0.45 } })

    // Legend reflects the per-foot counts
    await expect(page.locator('.legend')).toContainText('L 1')
    await expect(page.locator('.legend')).toContainText('R 2')

    await page.getByTestId('session-submit-btn').click()

    // Cleanup
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByTestId('confirm-delete-drill-btn').click()
    await expect(page.getByText(name)).toBeHidden()
  })

  test('shot_map: post outcome registers + heatmap toggle works in detail view', async ({ page }) => {
    const name = drillNameFor('Post test')

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Practice', exact: true }).click()
    await page.getByTestId('practice-add-drill-btn').click()
    await page.getByTestId('drill-name-input').fill(name)
    await page.getByTestId('drill-type-input').selectOption('shot_map')
    await page.getByTestId('drill-submit-btn').click()

    await page.getByRole('button').filter({ hasText: name }).first().click()
    await page.getByTestId('practice-log-session-btn').click()

    const canvas = page.getByTestId('practice-goal-map').locator('.goal-canvas')
    const box = await canvas.boundingBox()

    // One goal + one post
    await canvas.click({ position: { x: box.width * 0.5, y: box.height * 0.35 } })
    await page.getByTestId('outcome-pill-post').click()
    await canvas.click({ position: { x: box.width * 0.12, y: box.height * 0.2 } })

    await expect(page.locator('.legend')).toContainText('Post (1)')
    await page.getByTestId('session-submit-btn').click()

    // Detail view shows the heatmap toggle and lets us flip it off
    await expect(page.getByTestId('heatmap-toggle')).toBeVisible()
    await page.getByTestId('heatmap-toggle').click()
    // After toggling, the toggle is no longer active
    await expect(page.getByTestId('heatmap-toggle')).not.toHaveClass(/active/)

    // Cleanup
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByTestId('confirm-delete-drill-btn').click()
    await expect(page.getByText(name)).toBeHidden()
  })

  test('starter preset prefills the Add Drill modal', async ({ page }) => {
    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'Practice', exact: true }).click()

    // Only the empty state shows presets — only meaningful if user has no drills.
    const empty = page.getByTestId('practice-empty-state')
    if (await empty.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.getByTestId('practice-preset-count').click()
      // Modal opens with name pre-filled.
      await expect(page.getByTestId('practice-add-drill-modal')).toBeVisible()
      await expect(page.getByTestId('drill-name-input')).toHaveValue('Juggling')
      await expect(page.getByTestId('drill-type-input')).toHaveValue('count')
      // Cancel without saving.
      await page.getByRole('button', { name: 'Cancel' }).click()
    } else {
      test.info().annotations.push({ type: 'skip', description: 'user already has drills' })
    }
  })

  test('Practice tab is reachable on mobile viewport', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only sanity check')
    await page.goto('/dashboard')
    const practiceBtn = page.getByRole('button', { name: 'Practice', exact: true })
    await expect(practiceBtn).toBeVisible()
    await practiceBtn.click()
    await expect(page.getByTestId('practice-drill-list')).toBeVisible()
  })
})
