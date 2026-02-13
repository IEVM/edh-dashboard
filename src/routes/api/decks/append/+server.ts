import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { DataManagerError, getDataManager } from '$lib/server/data-manager';

export const POST: RequestHandler = async ({ locals, request }) => {
	const { deckName, targetBracket, summary, archidektLink } = await request.json();

	if (!deckName || typeof deckName !== 'string') {
		return new Response('Missing deckName', { status: 400 });
	}

	try {
		const manager = await getDataManager(locals.sessionId as string);
		await manager.appendDeck({
			deckName,
			targetBracket: targetBracket ?? null,
			summary: summary ?? null,
			archidektLink: archidektLink ?? null
		});
	} catch (err) {
		if (err instanceof DataManagerError) {
			return new Response(err.message, { status: err.status });
		}
		return new Response('Failed to append deck', { status: 500 });
	}

	return json({ ok: true });
};
