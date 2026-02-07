import type { Handle } from '@sveltejs/kit';
import { v4 as uuid } from 'uuid';
import { logError, logWarn, sessionHash } from '$lib/server/log';

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
	event.locals.requestId = uuid();

	const start = Date.now();

	try {
		const response = await resolve(event);
		const durationMs = Date.now() - start;
		const status = response.status;

		if (status >= 500) {
			logError('http.response', {
				status,
				method: event.request.method,
				path: event.url.pathname,
				durationMs,
				requestId: event.locals.requestId,
				session: sessionHash(sessionId)
			});
		} else if (status >= 400 && event.url.pathname.startsWith('/api/')) {
			logWarn('http.response', {
				status,
				method: event.request.method,
				path: event.url.pathname,
				durationMs,
				requestId: event.locals.requestId,
				session: sessionHash(sessionId)
			});
		}

		return response;
	} catch (err) {
		const durationMs = Date.now() - start;
		logError('http.exception', {
			method: event.request.method,
			path: event.url.pathname,
			durationMs,
			requestId: event.locals.requestId,
			session: sessionHash(sessionId),
			error: err
		});
		throw err;
	}
};
