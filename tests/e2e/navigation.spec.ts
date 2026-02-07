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

test('nav link to settings shows settings header', async ({ page }) => {
	await page.goto('/');

	await page.getByRole('link', { name: 'Settings' }).click();
	await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
	await expect(page.getByText('You have not yet linked a database.')).toBeVisible();
});

test('decks page shows missing database state', async ({ page }) => {
	await page.goto('/decks');

	await expect(page.getByRole('heading', { name: 'Your Decks' })).toBeVisible();
	await expect(page.getByText('No database selected.')).toBeVisible();
});
