import { redirect } from '@sveltejs/kit';

export const GET = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	if (code) {
		await locals.supabase.auth.exchangeCodeForSession(code);
	}

	const returnTo = url.searchParams.get('returnTo');
	const safeReturnTo =
		returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/';

	throw redirect(303, safeReturnTo);
};
