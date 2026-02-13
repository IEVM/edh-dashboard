// src/routes/dashboard/[deckId]/+page.server.ts
import type { PageServerLoad } from './$types';
import type { Deck } from '$lib/data/restructure';
import { DataManagerError, getDataManager } from '$lib/server/data-manager';

type PageData = {
	deck: Deck | null;
	error?: string;
};

/**
 * Server-side loader for a single deck dashboard.
 *
 * - Loads the requested deck and its games from the data backend.
 * - Finds the deck by id and enriches it with its games + derived stats.
 */
export const load: PageServerLoad = async ({ locals, params }): Promise<PageData> => {
	// Route params may already be decoded by SvelteKit; this keeps behavior explicit.
	const deckIdParam = decodeURIComponent(params.deckId);

	try {
		const manager = await getDataManager(locals);
		const deck: Deck | null = await manager.getDeckById(deckIdParam);

		if (!deck) {
			return {
				deck: null,
				error: `Deck "${deckIdParam}" was not found.`
			};
		}

		return { deck, error: undefined };
	} catch (err) {
		if (err instanceof DataManagerError) {
			return {
				deck: null,
				error: err.message
			};
		}

		console.error('Error loading deck dashboard', err);
		return {
			deck: null,
			error: 'Unexpected error while loading deck dashboard.'
		};
	}
};
