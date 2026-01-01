import type { PageServerLoad } from './$types';
import { getSessionData } from '$lib/server/session';
import { getSheetsClient } from '$lib/server/google';
import {
  loadDatabase,
  getDeckJson,
  type Deck
} from '$lib/data/restructure';

type DecksPageData = {
  error?: string;
  decks: Deck[];
};

export const load: PageServerLoad = async ({ locals }): Promise<DecksPageData> => {
  const sessionId = locals.sessionId as string;

  // use the same key you used in setSessionData
  const spreadsheetId = getSessionData<string>(sessionId, 'databaseSheetId');

  if (!spreadsheetId) {
    return {
      error: 'No database selected.',
      decks: []
    };
  }

  const sheetsClient = await getSheetsClient(sessionId);

  // Only ask for the "Decks" sheet
  const [decksSheet] = await loadDatabase(spreadsheetId, sheetsClient, ['Decks']);

  if (!Array.isArray(decksSheet) || decksSheet.length < 2) {
    return {
      error: 'No deck data found in the Decks sheet.',
      decks: []
    };
  }

  const [headerRow, ...rows] = decksSheet;

  // getDeckJson expects [header, ...rows]; we feed each row separately
  const decks: Deck[] = rows.map((row) => {
    const singleDeckData = [headerRow, row];
    return getDeckJson(singleDeckData);
  });

  return {
    decks
  };
};
