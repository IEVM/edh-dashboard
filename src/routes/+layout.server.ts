import type { LayoutServerLoad } from './$types';
import { POSTGRES_PRISMA_URL } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { getAuthUser } from '$lib/server/auth';

/**
 * Layout loader that exposes authentication state to the client.
 *
 * This allows the UI (nav, login button, etc.) to react to whether the current
 * session is authenticated via Supabase.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = await getAuthUser(locals);
	const isAuthenticated = !!user;
	const isE2E = env.E2E_TEST_MODE === '1';
	const hasDatabase = isE2E || !!POSTGRES_PRISMA_URL;

	return {
		isAuthenticated,
		hasDatabase,
		currentPath: url.pathname,
		user
	};
};
