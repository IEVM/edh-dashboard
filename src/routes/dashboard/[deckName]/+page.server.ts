// src/routes/dashboard/[deckName]/+page.server.ts
import type { PageServerLoad } from './$types';
import type { Deck } from '$lib/data/restructure';
import { DataManagerError, getDataManager } from '$lib/server/data-manager';

type PageData = {
	spreadsheetId: string | null;
	deck: Deck | null;
	error?: string;
};

/**
 * Server-side loader for a single deck dashboard.
 *
 * - Loads the requested deck and its games from the data backend.
 * - Finds the deck by name and enriches it with its games + derived stats.
 */
export const load: PageServerLoad = async ({ locals, params }): Promise<PageData> => {
	// Route params may already be decoded by SvelteKit; this keeps behavior explicit.
	const deckNameParam = decodeURIComponent(params.deckName);

	try {
		const manager = await getDataManager(locals);
		const deck: Deck | null = await manager.getDeckByName(deckNameParam);

		if (!deck) {
			return {
				spreadsheetId: manager.spreadsheetId,
				deck: null,
				error: `Deck "${deckNameParam}" was not found.`
			};
		}

		return { spreadsheetId: manager.spreadsheetId, deck, error: undefined };
	} catch (err) {
		if (err instanceof DataManagerError) {
			return {
				spreadsheetId: null,
				deck: null,
				error: err.message
			};
		}

		console.error('Error loading deck dashboard', err);
		return {
			spreadsheetId: null,
			deck: null,
			error: 'Unexpected error while loading deck dashboard.'
		};
	}
};
