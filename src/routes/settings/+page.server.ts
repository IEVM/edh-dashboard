import type { PageServerLoad } from './$types';
import { getAuthUser } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	const user = await getAuthUser(locals);

	return { backend: 'db', user };
};
