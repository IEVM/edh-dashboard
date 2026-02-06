import type { ParsedDeckLink } from './types';

function normalizeUrl(url: string | null): string | null {
	if (!url) return null;
	const trimmed = url.trim();
	if (!trimmed || trimmed === '-') return null;
	return trimmed;
}

export function parseUrl(url: string | null): ParsedDeckLink {
	const normalized = normalizeUrl(url);
	if (!normalized) {
		return { url: null, provider: null, id: null, label: null, error: null };
	}

	const archidekt = normalized.match(/^https?:\/\/(?:www\.)?archidekt\.com\/decks\/(\d+)/i);
	if (archidekt) {
		return {
			url: normalized,
			provider: 'archidekt',
			id: archidekt[1],
			label: 'Archidekt',
			error: null
		};
	}

	const moxfield = normalized.match(
		/^https?:\/\/(?:www\.)?moxfield\.com\/decks\/([A-Za-z0-9_-]+)/i
	);
	if (moxfield) {
		return {
			url: normalized,
			provider: 'moxfield',
			id: moxfield[1],
			label: 'Moxfield',
			error: null
		};
	}

	return {
		url: normalized,
		provider: null,
		id: null,
		label: null,
		error: 'Unsupported deck link.'
	};
}
