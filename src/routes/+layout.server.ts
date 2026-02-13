import type { LayoutServerLoad } from './$types';
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
	const isVercel = env.VERCEL === '1' || env.VERCEL === 'true';
	const hasDatabase =
		isE2E ||
		!!env.POSTGRES_PRISMA_URL ||
		!!env.POSTGRES_URL ||
		(!isVercel && (!!env.POSTGRES_URL_OVERRIDE || !!env.POSTGRES_URL_NON_POOLING));

	return {
		isAuthenticated,
		hasDatabase,
		currentPath: url.pathname,
		user
	};
};
