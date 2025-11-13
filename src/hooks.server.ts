import type { Handle } from '@sveltejs/kit';
import crypto from 'crypto';

export const handle: Handle = async ({ event, resolve }) => {
  let sessionId = event.cookies.get('session_id');

  if (!sessionId) {
    sessionId = crypto.randomBytes(16).toString('hex');
    event.cookies.set('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: false // set to true when using https in production
    });
  }

  event.locals.sessionId = sessionId;

  return resolve(event);
};
