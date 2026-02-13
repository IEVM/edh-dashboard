import { expect, test } from '@playwright/test';

test('shows reconnect banner on auth-required pages when logged out', async ({ page }) => {
	await page.goto('/settings');

	await expect(page.getByText('Session expired. Sign in to continue.')).toBeVisible();
	await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
