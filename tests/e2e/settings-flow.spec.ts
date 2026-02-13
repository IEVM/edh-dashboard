import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.route('**/api/auth/google', async (route) => {
		await route.fulfill({
			status: 302,
			headers: { location: '/api/auth/google/callback?code=test-code' }
		});
	});

	await page.route('**/api/auth/google/callback**', async (route) => {
		await route.fulfill({
			status: 302,
			headers: { location: '/' }
		});
	});
});

test('settings page shows db backend and dashboard loads in test mode', async ({ page }) => {
	await page.request.post('/api/test/session', {
		data: { authenticated: true }
	});

	await page.goto('/settings');

	await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
	await expect(page.getByText('Backend:')).toBeVisible();
	await expect(page.getByText('Postgres (Vercel)')).toBeVisible();

	await page.goto('/dashboard');
	await expect(page.getByRole('heading', { name: 'EDH Dashboard' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Deck Alpha' }).first()).toBeVisible();
});
