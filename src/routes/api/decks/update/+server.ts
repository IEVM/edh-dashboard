import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { DataManagerError, getDataManager } from '$lib/server/data-manager';

export const POST: RequestHandler = async ({ locals, request }) => {
	const { deckId, deckName, targetBracket, summary, archidektLink, originalName } =
		await request.json();

	if (!deckId || typeof deckId !== 'string') {
		return new Response('Invalid deckId', { status: 400 });
	}

	if (!deckName || typeof deckName !== 'string') {
		return new Response('Missing deckName', { status: 400 });
	}

	if (!originalName || typeof originalName !== 'string') {
		return new Response('Missing originalName', { status: 400 });
	}

	try {
		const manager = await getDataManager(locals);
		await manager.updateDeck({
			deckId,
			originalName,
			deckName,
			targetBracket: targetBracket ?? null,
			summary: summary ?? null,
			archidektLink: archidektLink ?? null
		});
	} catch (err) {
		if (err instanceof DataManagerError) {
			return new Response(err.message, { status: err.status });
		}
		return new Response('Failed to update deck', { status: 500 });
	}

	return json({ ok: true });
};
