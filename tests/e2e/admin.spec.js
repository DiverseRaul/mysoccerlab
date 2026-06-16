import { test, expect } from '@playwright/test'

/**
 * Auth-free admin smoke tests. The admin control-center is gated in
 * AdminLayout.vue (onMounted → getUser → loadEntitlements → redirect). Every
 * admin route, including the new nested ones, must bounce an unauthenticated
 * visitor to /login. Deeper behaviour is covered manually post-deploy and via
 * the previewMode harness (see the plan).
 */

const adminRoutes = [
  '/admin',
  '/admin/users',
  '/admin/matches',
  '/admin/practice',
  '/admin/waitlist',
  '/admin/audit',
  '/admin/dashboard'
]

for (const route of adminRoutes) {
  test(`${route} redirects to /login when unauthenticated`, async ({ page }) => {
    await page.goto(route)
    await page.waitForURL(/\/login/, { timeout: 5000 })
    expect(page.url()).toMatch(/\/login/)
  })
}

test('admin user detail deep-link redirects when unauthenticated', async ({ page }) => {
  await page.goto('/admin/users/some-user-id')
  await page.waitForURL(/\/login/, { timeout: 5000 })
  expect(page.url()).toMatch(/\/login/)
})
