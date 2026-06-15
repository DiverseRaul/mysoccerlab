import { test, expect } from '@playwright/test'

/**
 * Auth-free coverage for the redesigned Login and Sign Up pages.
 * Runs on both chromium-desktop and chromium-mobile.
 */

for (const { path, heading, submitLabel, switchLabel } of [
  { path: '/login', heading: /welcome back/i, submitLabel: /^sign in$/i, switchLabel: /sign up/i },
  { path: '/signup', heading: /create your account/i, submitLabel: /create account/i, switchLabel: /sign in/i }
]) {
  test(`${path} renders the full auth form`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: submitLabel })).toBeVisible()
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
    await expect(page.getByTestId('auth-card').getByRole('link', { name: switchLabel })).toBeVisible()
  })

  test(`${path} does not overflow horizontally`, async ({ page }) => {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement
      return el.scrollWidth - el.clientWidth
    })
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

test('password visibility toggle reveals the typed password', async ({ page }) => {
  await page.goto('/login')
  const password = page.getByLabel('Password', { exact: true })
  await password.fill('secret123')
  await expect(password).toHaveAttribute('type', 'password')
  await page.getByTestId('auth-toggle-password').click()
  await expect(password).toHaveAttribute('type', 'text')
  await page.getByTestId('auth-toggle-password').click()
  await expect(password).toHaveAttribute('type', 'password')
})

test('login with wrong credentials surfaces an error message', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('not-a-real-user@example.com')
  await page.getByLabel('Password', { exact: true }).fill('definitely-wrong-password')
  await page.getByTestId('auth-submit').click()
  await expect(page.getByTestId('auth-error')).toBeVisible({ timeout: 10000 })
})

test('login and signup pages link to each other', async ({ page }) => {
  await page.goto('/login')
  const card = page.getByTestId('auth-card')
  await card.getByRole('link', { name: /sign up/i }).click()
  await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible()
  await card.getByRole('link', { name: /sign in/i }).click()
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
})
