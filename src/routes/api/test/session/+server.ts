import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { clearTokens, saveTokens } from '$lib/server/google';
import { setSessionData } from '$lib/server/session';

type Body = {
	authenticated?: boolean;
	databaseId?: string | null;
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (env.E2E_TEST_MODE !== '1') {
		return new Response('Not found', { status: 404 });
	}

	let body: Body = {};
	try {
		body = (await request.json()) as Body;
	} catch {
		body = {};
	}

	if (body.authenticated === true) {
		await saveTokens(locals.sessionId, {
			access_token: 'test-access',
			refresh_token: 'test-refresh',
			scope: 'openid email profile',
			token_type: 'Bearer',
			expiry_date: Date.now() + 60 * 60 * 1000
		});
	} else if (body.authenticated === false) {
		await clearTokens(locals.sessionId);
	}

	if (body.databaseId !== undefined) {
		await setSessionData(locals.sessionId, 'databaseSheetId', body.databaseId);
	}

	return new Response('ok');
};
