import type { PageServerLoad } from './$types';
import type { UserProfile } from '$lib/server/google';
import { getSessionData } from '$lib/server/session';

export const load: PageServerLoad = async ({ locals }) => {
	const user = (await getSessionData<UserProfile>(locals.sessionId, 'userProfile')) ?? null;

	return { backend: 'db', user };
};
