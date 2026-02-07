import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Layout from '../../src/routes/+layout.svelte';

describe('Layout auth state', () => {
	it('shows sign-in button when logged out', () => {
		const { getByRole, queryByText, queryByRole } = render(Layout, {
			props: {
				data: {
					isAuthenticated: false,
					hasDatabase: false,
					currentPath: '/'
				}
			}
		});

		expect(getByRole('button', { name: /sign in with google/i })).toBeTruthy();
		expect(queryByText('Signed in')).toBeNull();
		expect(queryByRole('link', { name: 'Settings' })).toBeNull();
	});

	it('shows nav items when authenticated and database is linked', () => {
		const { getByText, queryByRole: queryLink } = render(Layout, {
			props: {
				data: {
					isAuthenticated: true,
					hasDatabase: true,
					currentPath: '/'
				}
			}
		});

		expect(getByText('Signed in')).toBeTruthy();
		expect(queryLink('link', { name: 'Settings' })).toBeTruthy();
		expect(queryLink('link', { name: 'Decks' })).toBeTruthy();
		expect(queryLink('link', { name: 'Dashboard' })).toBeTruthy();
	});
});
