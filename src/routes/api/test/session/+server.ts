import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { setSessionData } from '$lib/server/session';

type Body = {
	authenticated?: boolean;
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
		await setSessionData(locals.sessionId, 'testUser', {
			id: 'test-user',
			email: 'test@example.com',
			name: 'Test User',
			picture: 'https://example.com/avatar.png'
		});
	} else if (body.authenticated === false) {
		await setSessionData(locals.sessionId, 'testUser', null);
	}

	return new Response('ok');
};
