import type { LayoutServerLoad } from './$types';
import { POSTGRES_URL } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { hasTokens } from '$lib/server/google';
import type { UserProfile } from '$lib/server/google';
import { getSessionData } from '$lib/server/session';

/**
 * Layout loader that exposes authentication state to the client.
 *
 * This allows the UI (nav, login button, etc.) to react to whether the current
 * session has Google OAuth tokens stored.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const isAuthenticated = await hasTokens(locals.sessionId);
	const isE2E = env.E2E_TEST_MODE === '1';
	const hasDatabase = isE2E || !!POSTGRES_URL;
	const user = (await getSessionData<UserProfile>(locals.sessionId, 'userProfile')) ?? null;

	return {
		isAuthenticated,
		hasDatabase,
		currentPath: url.pathname,
		user
	};
};
