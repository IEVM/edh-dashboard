import type { LayoutServerLoad } from './$types';
import { hasTokens } from '$lib/server/google';
import { getSessionData } from '$lib/server/session';

/**
 * Layout loader that exposes authentication state to the client.
 *
 * This allows the UI (nav, login button, etc.) to react to whether the current
 * session has Google OAuth tokens stored.
 */
export const load: LayoutServerLoad = async ({ locals, url }) => {
  const isAuthenticated = await hasTokens(locals.sessionId);
  const databaseSheetId = await getSessionData<string>(locals.sessionId, 'databaseSheetId');
  const hasDatabase = !!databaseSheetId;

  return {
    isAuthenticated,
    hasDatabase,
    currentPath: url.pathname
  };
};
