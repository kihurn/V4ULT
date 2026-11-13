import { test, expect } from '@playwright/test'

test('glass pill navigation slides, exposes mobile active labels and respects reduced motion', async ({ page }) => {
  const token = `e30.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now()/1000)+3600 })).toString('base64url')}.sig`
  await page.route('**/api/**', route => route.fulfill({ json: route.request().url().includes('auth-')
    ? { token, record: { id: 'user123', collectionId: 'users', collectionName: 'users' } }
    : { page: 1, totalItems: 1, totalPages: 1, items: [{ id: 'record1', title: 'A saved thought', status: 'todo', due_date: '', content: 'Remember this', tags: '', kind: 'information', created: '2026-11-13 12:00:00Z' }] } }))
  await page.goto('/')
  await page.getByLabel('Email address').fill('test@example.com')
  await page.getByLabel('Password', { exact: true }).fill('password')
  await page.getByRole('button', { name: 'Enter your space' }).click()
  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  for (const width of [320, 390, 760, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const label of ['Tasks', 'Notes', 'Library', 'Overview']) {
      const button = nav.getByRole('button', { name: label, exact: true })
      await button.click()
      await expect(button).toHaveAttribute('aria-current', 'page')
      await expect.poll(async () => button.evaluate(el => {
        const lens = el.parentElement!.querySelector('.nav-indicator')!.getBoundingClientRect()
        const target = el.getBoundingClientRect()
        return Math.abs(lens.x-target.x) < 1 && Math.abs(lens.width-target.width) < 1
      })).toBe(true)
      for (const other of await nav.locator('button').all()) {
        const active = await other.getAttribute('aria-current') === 'page'
        await expect.poll(() => other.locator('.nav-label').evaluate(el => el.getBoundingClientRect().width > 1)).toBe(width > 760 || active)
      }
      expect(await nav.evaluate(el => { const r=el.getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth })).toBe(true)
    }
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await nav.getByRole('button', { name: 'Notes', exact: true }).click()
  await expect(page.locator('.note-card')).toBeVisible()
  await expect(page.locator('.note-card')).toHaveCSS('animation-name', 'tile-in')
  await page.screenshot({ path: '/tmp/v4ult-glass-nav-mobile.png', fullPage: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(nav.locator('.nav-indicator')).toHaveCSS('transition-duration', '0s')
  await expect(page.locator('.note-card')).toHaveCSS('animation-name', 'none')
  await nav.getByRole('button', { name: 'Library', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(nav.getByRole('button', { name: 'Library', exact: true })).toBeFocused()
  await expect(nav.getByRole('button', { name: 'Library', exact: true })).toHaveAttribute('aria-current', 'page')
})
