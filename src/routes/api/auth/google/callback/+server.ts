import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { handleAuthCode } from '$lib/server/google';
import { logError, logInfo, sessionHash } from '$lib/server/log';

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
		logError('auth.callback.error', {
			requestId: event.locals.requestId,
			session: sessionHash(event.locals.sessionId),
			message: 'oauth_error'
		});
		throw error(400, `Google OAuth error: ${errorParam}`);
	}

	if (!code) {
		logError('auth.callback.error', {
			requestId: event.locals.requestId,
			session: sessionHash(event.locals.sessionId),
			message: 'missing_code'
		});
		throw error(400, 'Missing OAuth code');
	}

	// Session id is populated in hooks.server.ts.
	const sessionId = event.locals.sessionId;

	await handleAuthCode(sessionId, code);
	logInfo('auth.callback.success', {
		requestId: event.locals.requestId,
		session: sessionHash(sessionId)
	});

	// After login, go back to the homepage.
	throw redirect(302, '/');
}
