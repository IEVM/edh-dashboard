import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getAuthUrl: vi.fn(() => 'https://accounts.google.com/o/oauth2/v2/auth'),
	handleAuthCode: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$lib/server/google', () => ({
	getAuthUrl: mocks.getAuthUrl,
	handleAuthCode: mocks.handleAuthCode
}));

import { GET as startAuth } from '../../src/routes/api/auth/google/+server';
import { GET as authCallback } from '../../src/routes/api/auth/google/callback/+server';

describe('GET /api/auth/google', () => {
	it('redirects to the Google auth URL', async () => {
		await expect(
			startAuth({ locals: { sessionId: 'session-1', requestId: 'req-1' } } as any)
		).rejects.toMatchObject({
			status: 302,
			location: 'https://accounts.google.com/o/oauth2/v2/auth'
		});
	});
});

describe('GET /api/auth/google/callback', () => {
	it('rejects when Google returns an error', async () => {
		const event = {
			url: new URL('http://localhost/api/auth/google/callback?error=access_denied'),
			locals: { sessionId: 'session-1' }
		} as any;

		await expect(authCallback(event)).rejects.toMatchObject({ status: 400 });
	});

	it('rejects when OAuth code is missing', async () => {
		const event = {
			url: new URL('http://localhost/api/auth/google/callback'),
			locals: { sessionId: 'session-1' }
		} as any;

		await expect(authCallback(event)).rejects.toMatchObject({ status: 400 });
	});

	it('stores tokens and redirects to home on success', async () => {
		const event = {
			url: new URL('http://localhost/api/auth/google/callback?code=fake-code'),
			locals: { sessionId: 'session-1' }
		} as any;

		await expect(authCallback(event)).rejects.toMatchObject({ status: 302, location: '/' });
		expect(mocks.handleAuthCode).toHaveBeenCalledWith('session-1', 'fake-code');
	});
});
