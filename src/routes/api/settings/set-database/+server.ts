import type { RequestHandler } from './$types';
import { setSessionData } from '$lib/server/session';

/**
 * Stores the selected spreadsheet ID in the current server session.
 *
 * Expects JSON body: `{ spreadsheetId: string }`.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const { spreadsheetId } = await request.json();

  if (!spreadsheetId) {
    return new Response('Missing spreadsheetId', { status: 400 });
  }

  // Store in session for later API calls (e.g. loading Games/Decks).
  setSessionData(locals.sessionId, 'databaseSheetId', spreadsheetId);

  return new Response('ok');
};
