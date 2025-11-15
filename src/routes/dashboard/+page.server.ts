// src/routes/+page.server.ts
import type { PageServerLoad } from './$types';
import { getSessionData } from '$lib/server/session';

export const load: PageServerLoad = async ({ locals }) => {
  const spreadsheetId =
    getSessionData(locals.sessionId, 'databaseSheetId') ?? null;

  return { spreadsheetId };
};
