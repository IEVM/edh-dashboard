import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Proxies an Archidekt deck request so the client can fetch deck data without
 * calling Archidekt directly (and to keep a stable same-origin API endpoint).
 *
 * @throws 400 if the deck id is missing
 * @throws <status> if Archidekt responds with a non-2xx status
 */
export const GET: RequestHandler = async ({ params }) => {
	const id = params.id;

	if (!id) {
		throw error(400, 'Missing deck id');
	}

	const res = await fetch(`https://archidekt.com/api/decks/${id}/`);

	if (!res.ok) {
		console.error('Archidekt API error:', res.status, await res.text());
		throw error(res.status, 'Failed to load deck from Archidekt');
	}

	const data = await res.json();
	return json(data);
};
