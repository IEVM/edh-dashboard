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

test('deck detail page renders summary and stats in test mode', async ({ page }) => {
	await page.request.post('/api/test/session', {
		data: { authenticated: true, databaseId: 'e2e-sheet' }
	});

	await page.goto('/decks');
	await expect(page.getByRole('heading', { name: 'Your Decks' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Deck Alpha' })).toBeVisible();

	await page.getByRole('link', { name: 'Deck Alpha' }).first().click();
	await expect(page.getByRole('heading', { name: 'Deck Alpha' })).toBeVisible();
	await expect(page.getByText('Alpha summary deck for e2e tests.').first()).toBeVisible();
	await expect(page.getByText('Games played')).toBeVisible();
});
