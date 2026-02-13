import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { DataManagerError, getDataManager } from '$lib/server/data-manager';

export const POST: RequestHandler = async ({ locals, request }) => {
	const { deckId, deckName } = await request.json();

	if (!deckId || typeof deckId !== 'string') {
		return new Response('Invalid deckId', { status: 400 });
	}

	if (!deckName || typeof deckName !== 'string') {
		return new Response('Missing deckName', { status: 400 });
	}

	try {
		const manager = await getDataManager(locals.sessionId as string);
		const deletedGames = await manager.deleteDeck(deckId, deckName);
		return json({ ok: true, deletedGames });
	} catch (err) {
		if (err instanceof DataManagerError) {
			return new Response(err.message, { status: err.status });
		}
		return new Response('Failed to delete deck', { status: 500 });
	}
};
