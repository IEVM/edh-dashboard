import { redirect } from '@sveltejs/kit';
import { getAuthUrl } from '$lib/server/google';

/**
 * Starts the Google OAuth flow by redirecting the user to Google's consent screen.
 */
export async function GET() {
	const url = getAuthUrl();
	throw redirect(302, url);
}
