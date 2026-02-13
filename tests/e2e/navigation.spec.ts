import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.route('**/api/archidekt/**', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ name: 'Deck Alpha', featured: '', categories: [] })
		});
	});
});

test('home page renders welcome copy and sign-in button', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: /welcome to your edh dashboard/i })).toBeVisible();
	await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('nav shows items only when authenticated', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Decks' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(0);

	await page.request.post('/api/test/session', { data: { authenticated: true } });
	await page.goto('/');

	await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(1);
	await expect(page.getByRole('link', { name: 'Decks' })).toHaveCount(1);
	await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveCount(1);
});

test('decks page shows auth error when logged out', async ({ page }) => {
	await page.goto('/decks');

	await expect(page.getByRole('heading', { name: 'Your Decks' })).toBeVisible();
	await expect(page.getByText('Not authenticated')).toBeVisible();
});
