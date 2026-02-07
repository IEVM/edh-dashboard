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

test('settings flow saves spreadsheet and loads dashboard in test mode', async ({ page }) => {
	await page.request.post('/api/test/session', {
		data: { authenticated: true, databaseId: null }
	});

	page.on('dialog', (dialog) => dialog.accept());

	await page.goto('/settings');

	await page.request.post('/api/settings/set-database', {
		data: { spreadsheetId: 'e2e-sheet' }
	});

	await page.reload();

	await expect(page.getByText('currently linked as the database.')).toBeVisible();
	await expect(page.getByText('You have not yet linked a database.')).toHaveCount(0);
	await expect(page.locator('a[href*="e2e-sheet"]').first()).toBeVisible();

	await page.goto('/dashboard');
	await expect(page.getByRole('heading', { name: 'EDH Dashboard' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Deck Alpha' }).first()).toBeVisible();
});
