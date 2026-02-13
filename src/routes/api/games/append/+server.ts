import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { DataManagerError, getDataManager } from '$lib/server/data-manager';

export const POST: RequestHandler = async ({ locals, request }) => {
	const {
		deckName,
		winner,
		fun,
		p2Fun,
		p3Fun,
		p4Fun,
		notes,
		estBracket
	} = await request.json();

	if (!deckName || typeof deckName !== 'string') {
		return new Response('Missing deckName', { status: 400 });
	}

	try {
		const manager = await getDataManager(locals.sessionId as string);
		await manager.appendGame({
			deckName,
			winner: winner ?? null,
			fun: fun ?? null,
			p2Fun: p2Fun ?? null,
			p3Fun: p3Fun ?? null,
			p4Fun: p4Fun ?? null,
			notes: notes ?? null,
			estBracket: estBracket ?? null
		});
	} catch (err) {
		if (err instanceof DataManagerError) {
			return new Response(err.message, { status: err.status });
		}
		return new Response('Failed to append game', { status: 500 });
	}

	return json({ ok: true });
};
