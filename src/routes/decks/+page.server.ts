import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { getSessionData } from '$lib/server/session';
import { getSheetsClient } from '$lib/server/google';
import { loadDatabase, getDeckJson, type Deck } from '$lib/data/restructure';
import { E2E_DECKS_SHEET } from '$lib/server/e2e-fixtures';

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

	const decksSheet =
		env.E2E_TEST_MODE === '1'
			? E2E_DECKS_SHEET
			: (await loadDatabase(spreadsheetId, await getSheetsClient(sessionId), ['Decks']))[0];

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
