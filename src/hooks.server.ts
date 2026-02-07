import type { Handle } from '@sveltejs/kit';
import { v4 as uuid } from 'uuid';

export const handle: Handle = async ({ event, resolve }) => {
	// Retrieve or create sessionId
	let sessionId = event.cookies.get('sessionId');
	if (!sessionId) {
		sessionId = uuid();
		event.cookies.set('sessionId', sessionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});
	}

	// Put sessionId into locals
	event.locals.sessionId = sessionId;

	return resolve(event);
};
