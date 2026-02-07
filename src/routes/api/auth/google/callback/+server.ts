import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { handleAuthCode } from '$lib/server/google';

/**
 * OAuth callback endpoint.
 *
 * - Reads `code` (success) or `error` (failure) from Google redirect query params.
 * - Exchanges the code for tokens and stores them keyed by the current sessionId.
 * - Redirects back to the homepage on success.
 */
export async function GET(event: RequestEvent) {
	const code = event.url.searchParams.get('code');
	const errorParam = event.url.searchParams.get('error');

	if (errorParam) {
		throw error(400, `Google OAuth error: ${errorParam}`);
	}

	if (!code) {
		throw error(400, 'Missing OAuth code');
	}

	// Session id is populated in hooks.server.ts.
	const sessionId = event.locals.sessionId;

	await handleAuthCode(sessionId, code);

	// After login, go back to the homepage.
	throw redirect(302, '/');
}
