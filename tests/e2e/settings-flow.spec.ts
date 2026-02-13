import { expect, test } from '@playwright/test';

test('settings page shows db backend and dashboard loads in test mode', async ({ page }) => {
	await page.request.post('/api/test/session', {
		data: { authenticated: true }
	});

	await page.goto('/settings');

	await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
	await expect(page.getByText('Backend:')).toBeVisible();
	await expect(page.getByText('Postgres (Supabase)')).toBeVisible();

	await page.goto('/dashboard');
	await expect(page.getByRole('heading', { name: 'EDH Dashboard' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Deck Alpha' }).first()).toBeVisible();
});
