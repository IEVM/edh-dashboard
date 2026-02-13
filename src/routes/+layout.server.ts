import type { LayoutServerLoad } from './$types';
import {
	POSTGRES_PRISMA_URL,
	POSTGRES_URL,
	POSTGRES_URL_NON_POOLING,
	POSTGRES_URL_OVERRIDE
} from '$env/static/private';
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
		(!isVercel && !!POSTGRES_URL_OVERRIDE) ||
		!!POSTGRES_URL_NON_POOLING ||
		!!POSTGRES_PRISMA_URL ||
		!!POSTGRES_URL;

	return {
		isAuthenticated,
		hasDatabase,
		currentPath: url.pathname,
		user
	};
};
