import type { LayoutServerLoad } from './$types';
import { hasTokens } from '$lib/server/google';

/**
 * Layout loader that exposes authentication state to the client.
 *
 * This allows the UI (nav, login button, etc.) to react to whether the current
 * session has Google OAuth tokens stored.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  const isAuthenticated = hasTokens(locals.sessionId);
  return { isAuthenticated };
};
