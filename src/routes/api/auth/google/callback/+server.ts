import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { handleAuthCode } from '$lib/server/google';

export async function GET(event: RequestEvent) {
  const code = event.url.searchParams.get('code');
  const errorParam = event.url.searchParams.get('error');

  if (errorParam) {
    throw error(400, `Google OAuth error: ${errorParam}`);
  }

  if (!code) {
    throw error(400, 'Missing OAuth code');
  }

  // this sessionId comes from hooks.server.ts
  const sessionId = event.locals.sessionId;

  await handleAuthCode(sessionId, code);

  // after login, back to the homepage
  throw redirect(302, '/');
}
