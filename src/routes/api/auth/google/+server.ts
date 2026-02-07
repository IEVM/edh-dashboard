import { redirect } from '@sveltejs/kit';
import { getAuthUrl } from '$lib/server/google';
import { logInfo, sessionHash } from '$lib/server/log';

/**
 * Starts the Google OAuth flow by redirecting the user to Google's consent screen.
 */
export async function GET({ locals }: { locals: { sessionId: string; requestId?: string } }) {
	logInfo('auth.start', {
		requestId: locals.requestId,
		session: sessionHash(locals.sessionId)
	});
	const url = getAuthUrl();
	throw redirect(302, url);
}
