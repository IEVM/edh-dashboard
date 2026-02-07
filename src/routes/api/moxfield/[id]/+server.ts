import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Proxies a Moxfield deck request so the client can fetch deck data without
 * calling Moxfield directly (same-origin, avoids CORS issues).
 *
 * @throws 400 if the deck id is missing
 * @throws <status> if Moxfield responds with a non-2xx status
 */
export const GET: RequestHandler = async ({ params }) => {
	const id = params.id;

	if (!id) {
		throw error(400, 'Missing deck id');
	}

	const res = await fetch(`https://api.moxfield.com/v2/decks/all/${id}`, {
		headers: {
			Accept: 'application/json',
			'User-Agent': 'edh-dashboard/1.0',
			Referer: 'https://moxfield.com/',
			Origin: 'https://moxfield.com'
		}
	});

	if (!res.ok) {
		console.error('Moxfield API error:', res.status, await res.text());
		throw error(res.status, 'Failed to load deck from Moxfield');
	}

	const data = await res.json();
	return json(data);
};
