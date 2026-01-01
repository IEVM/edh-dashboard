// src/routes/dashboard/[deckName]/+page.server.ts
import type { PageServerLoad } from './$types';
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

type PageData = {
	spreadsheetId: string | null;
	deck: Deck | null;
	error?: string;
};

export const load: PageServerLoad = async ({ locals, params }): Promise<PageData> => {
	const sessionId = locals.sessionId as string;
	const spreadsheetId = getSessionData<string>(sessionId, 'databaseSheetId');

	const deckNameParam = decodeURIComponent(params.deckName);

	if (!spreadsheetId) {
		return {
			spreadsheetId: null,
			deck: null,
			error: 'No database selected. Go to Settings and choose a spreadsheet.'
		};
	}

	try {
		const sheetsClient = await getSheetsClient(sessionId);

		// 1) Load both Games and Decks sheets
		const [gamesSheet, decksSheet] = await loadDatabase(
			spreadsheetId,
			sheetsClient,
			['Games', 'Decks']
		);

		// 2) Find the matching deck row using the utils

		// filterData:
		// - expects the *whole* sheet (with header row)
		// - header names are normalized to lowercase, so we use "deckname"
		const filteredRows = filterData(decksSheet, [
			{ column: 'name', match: deckNameParam }
		]);

		if (!filteredRows.length) {
			return {
				spreadsheetId,
				deck: null,
				error: `Deck "${deckNameParam}" was not found in the Decks sheet.`
			};
		}

		// Reattach header row so getDeckJson can work on the snippet
		const headerRow = decksSheet[0];
		const deckSnippet = [headerRow, ...filteredRows];

		let deck: Deck = getDeckJson(deckSnippet);

		// 3) Attach this deck's games (from the Games sheet) using withGames
		deck = withGames(deck, gamesSheet);

		// 4) Attach stats derived from those games
		deck = withStatsFromGames(deck);

		return {
			spreadsheetId,
			deck,
			error: undefined
		};
	} catch (err) {
		console.error('Error loading deck dashboard', err);
		return {
			spreadsheetId,
			deck: null,
			error: 'Unexpected error while loading deck dashboard.'
		};
	}
};
