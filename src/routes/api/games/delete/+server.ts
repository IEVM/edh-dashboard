import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { DataManagerError, getDataManager } from '$lib/server/data-manager';

export const POST: RequestHandler = async ({ locals, request }) => {
	const { gameId } = await request.json();

	if (!gameId || typeof gameId !== 'string') {
		return new Response('Invalid gameId', { status: 400 });
	}

	try {
		const manager = await getDataManager(locals);
		await manager.deleteGame(gameId);
	} catch (err) {
		if (err instanceof DataManagerError) {
			return new Response(err.message, { status: err.status });
		}
		return new Response('Failed to delete game', { status: 500 });
	}

	return json({ ok: true });
};
