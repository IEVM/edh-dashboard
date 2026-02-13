import { env } from '$env/dynamic/private';
import { getSessionData } from '$lib/server/session';

export type AuthUser = {
	id: string;
	email: string | null;
	name: string | null;
	picture: string | null;
};

export async function getAuthUser(locals: App.Locals): Promise<AuthUser | null> {
	if (env.E2E_TEST_MODE === '1') {
		const testUser = await getSessionData<AuthUser>(locals.sessionId, 'testUser');
		if (testUser) return testUser;
	}

	const { data, error } = await locals.supabase.auth.getUser();
	if (error || !data.user) return null;

	const metadata = data.user.user_metadata ?? {};
	const name =
		typeof metadata.full_name === 'string'
			? metadata.full_name
			: typeof metadata.name === 'string'
				? metadata.name
				: null;
	const picture = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : null;

	return {
		id: data.user.id,
		email: data.user.email ?? null,
		name,
		picture
	};
}
