import type { LayoutServerLoad } from './$types';
import { hasTokens } from '$lib/server/google';

export const load: LayoutServerLoad = async ({ locals }) => {
  const isAuthenticated = hasTokens(locals.sessionId);
  return { isAuthenticated };
};
