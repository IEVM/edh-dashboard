import type { PageServerLoad } from './$types';
import { getSessionData } from '$lib/server/session';
import { getSheetsClient } from '$lib/server/google';
import { loadDatabase, getDeckJson, type Deck } from '$lib/data/restructure';

type DecksPageData = {
  error?: string;
  decks: Deck[];
};

/**
 * Server-side loader for the "Decks" overview page.
 *
 * - Reads the selected spreadsheetId from the server session.
 * - Loads the "Decks" sheet.
 * - Converts each row into a `Deck` domain object.
 */
export const load: PageServerLoad = async ({ locals }): Promise<DecksPageData> => {
  const sessionId = locals.sessionId as string;

  // Stored via setSessionData(..., 'databaseSheetId', ...)
  const spreadsheetId = await getSessionData<string>(sessionId, 'databaseSheetId');

  if (!spreadsheetId) {
    return {
      error: 'No database selected.',
      decks: []
    };
  }

  // Note: getSheetsClient is synchronous in your current implementation.
  const sheetsClient = await getSheetsClient(sessionId);

  // Only load the "Decks" sheet
  const [decksSheet] = await loadDatabase(spreadsheetId, sheetsClient, ['Decks']);

  if (!Array.isArray(decksSheet) || decksSheet.length < 2) {
    return {
      error: 'No deck data found in the Decks sheet.',
      decks: []
    };
  }

  const [headerRow, ...rows] = decksSheet;

  // getDeckJson expects [headerRow, ...dataRows]; we feed each row separately.
  const decks: Deck[] = rows.map((row) => getDeckJson([headerRow, row]));

  return { decks };
};
