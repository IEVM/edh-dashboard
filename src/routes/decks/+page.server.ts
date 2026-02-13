import type { PageServerLoad } from './$types';
import { getDataManager, DataManagerError } from '$lib/server/data-manager';
import type { Deck } from '$lib/data/restructure';

type DecksPageData = {
	error?: string;
	decks: Deck[];
};

/**
 * Server-side loader for the "Decks" overview page.
 *
 * - Loads decks from the active data backend.
 */
export const load: PageServerLoad = async ({ locals }): Promise<DecksPageData> => {
	try {
		const manager = await getDataManager(locals);
		const decks = await manager.getDecks();

		if (!decks.length) {
			return {
				error: 'No deck data found yet.',
				decks: []
			};
		}

		return { decks };
	} catch (err) {
		if (err instanceof DataManagerError) {
			return { error: err.message, decks: [] };
		}

		return {
			error: 'Unexpected error while loading decks.',
			decks: []
		};
	}
};
