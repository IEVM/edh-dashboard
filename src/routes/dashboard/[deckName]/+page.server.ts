// src/routes/dashboard/[deckName]/+page.server.ts
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { getSessionData } from '$lib/server/session';
import { getSheetsClient } from '$lib/server/google';

import {
	loadDatabase,
	filterData,
	getDeckJson,
	withGames,
	withStatsFromGames,
	type Deck
} from '$lib/data/restructure';
import { E2E_DECKS_SHEET, E2E_GAMES_SHEET } from '$lib/server/e2e-fixtures';

type PageData = {
	spreadsheetId: string | null;
	deck: Deck | null;
	error?: string;
};

/**
 * Server-side loader for a single deck dashboard.
 *
 * - Reads the selected spreadsheetId from the user's server session.
 * - Loads "Decks" + "Games" from the spreadsheet.
 * - Finds the deck by name and enriches it with its games + derived stats.
 */
export const load: PageServerLoad = async ({ locals, params }): Promise<PageData> => {
	const sessionId = locals.sessionId as string;
	const spreadsheetId = await getSessionData<string>(sessionId, 'databaseSheetId');

	// Route params may already be decoded by SvelteKit; this keeps behavior explicit.
	const deckNameParam = decodeURIComponent(params.deckName);

	if (!spreadsheetId) {
		return {
			spreadsheetId: null,
			deck: null,
			error: 'No database selected. Go to Settings and choose a spreadsheet.'
		};
	}

	try {
		const [gamesSheet, decksSheet] =
			env.E2E_TEST_MODE === '1'
				? [E2E_GAMES_SHEET, E2E_DECKS_SHEET]
				: await loadDatabase(spreadsheetId, await getSheetsClient(sessionId), ['Games', 'Decks']);

		// 2) Find the matching deck row in the "Decks" sheet by the "Name" column.
		// filterData expects the full sheet including the header row at index 0.
		const filteredRows = filterData(decksSheet, [{ column: 'name', match: deckNameParam }]);

		if (!filteredRows.length) {
			return {
				spreadsheetId,
				deck: null,
				error: `Deck "${deckNameParam}" was not found in the Decks sheet.`
			};
		}

		// Reattach the header row so getDeckJson can parse the columns correctly.
		const headerRow = decksSheet[0];
		const deckSnippet = [headerRow, ...filteredRows];

		let deck: Deck = getDeckJson(deckSnippet);

		// 3) Attach this deck's games (from the "Games" sheet)
		deck = withGames(deck, gamesSheet);

		// 4) Attach stats derived from those games
		deck = withStatsFromGames(deck);

		return { spreadsheetId, deck, error: undefined };
	} catch (err) {
		console.error('Error loading deck dashboard', err);
		return {
			spreadsheetId,
			deck: null,
			error: 'Unexpected error while loading deck dashboard.'
		};
	}
};
