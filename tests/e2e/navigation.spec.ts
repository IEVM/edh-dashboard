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

test('home page renders welcome copy and sign-in button', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: /welcome to your edh dashboard/i })).toBeVisible();
	await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
});

test('sign-in button triggers mocked OAuth flow', async ({ page }) => {
	await page.goto('/');

	await page.getByRole('button', { name: /sign in with google/i }).click();
	await expect(page).toHaveURL('/');
});

test('nav shows items only when auth and database requirements are met', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Decks' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);

	await page.request.post('/api/test/session', { data: { authenticated: true } });
	await page.goto('/');

	await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(1);
	await expect(page.getByRole('link', { name: 'Decks' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);

	await page.request.post('/api/test/session', {
		data: { authenticated: true, databaseId: 'test-db-id' }
	});
	await page.goto('/');

	await expect(page.getByRole('link', { name: 'Decks' })).toHaveCount(1);
	await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(1);
});

test('decks page shows missing database state', async ({ page }) => {
	await page.goto('/decks');

	await expect(page.getByRole('heading', { name: 'Your Decks' })).toBeVisible();
	await expect(page.getByText('No database selected.')).toBeVisible();
});
