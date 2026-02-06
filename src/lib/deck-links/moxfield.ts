import type { DeckLoadResult } from './types';

function toArray(value: unknown): unknown[] {
	if (!value) return [];
	if (Array.isArray(value)) return value;
	if (typeof value === 'object') return Object.values(value as Record<string, unknown>);
	return [];
}

function extractImageFromCard(card: any): string {
	if (!card) return '';
	const imageUris =
		card.image_uris ??
		card.imageUris ??
		card?.card?.image_uris ??
		card?.card?.imageUris ??
		card?.scryfallCard?.image_uris ??
		card?.scryfallCard?.imageUris ??
		card?.oracleCard?.image_uris ??
		card?.oracleCard?.imageUris;

	if (imageUris) {
		if (typeof imageUris === 'string') return imageUris;
		const bySize =
			imageUris.art_crop ??
			imageUris.border_crop ??
			imageUris.normal ??
			imageUris.large ??
			imageUris.small ??
			'';
		if (bySize) return bySize;
	}

	const scryfallId =
		card?.scryfall_id ?? card?.scryfallId ?? card?.scryfallCard?.id ?? card?.scryfallCard?.scryfall_id;
	if (typeof scryfallId === 'string' && scryfallId.length >= 2) {
		const a = scryfallId[0];
		const b = scryfallId[1];
		return `https://cards.scryfall.io/art_crop/front/${a}/${b}/${scryfallId}.jpg`;
	}

	return '';
}

function extractCardName(card: any): string | null {
	return (
		card?.name ??
		card?.card?.name ??
		card?.oracleCard?.name ??
		card?.oracle_card?.name ??
		card?.scryfallCard?.name ??
		null
	);
}

function extractMoxfieldCommanders(deck: any): { names: string[]; image: string } {
	const entries: any[] = [];
	entries.push(...toArray(deck?.commanders));
	entries.push(...toArray(deck?.commander));
	entries.push(...toArray(deck?.commanderCards));
	entries.push(...toArray(deck?.commanderCard));

	const boards = ['mainboard', 'sideboard', 'maybeboard', 'commanderboard', 'commanders'];
	for (const boardKey of boards) {
		const boardEntries = toArray((deck as any)?.[boardKey]);
		for (const entry of boardEntries) {
			const boardType =
				(entry as any)?.boardType ??
				(entry as any)?.board ??
				(entry as any)?.type ??
				(entry as any)?.section ??
				'';
			if (
				(entry as any)?.isCommander === true ||
				(typeof boardType === 'string' && boardType.toLowerCase().includes('commander'))
			) {
				entries.push(entry);
			}
		}
	}

	let imageUrl = '';
	const names: string[] = [];
	for (const entry of entries) {
		const card = (entry as any)?.card ?? entry;
		const name = extractCardName(card);
		if (name) names.push(name);
		if (!imageUrl) {
			imageUrl = extractImageFromCard(card);
		}
	}

	const deduped = Array.from(new Set(names));
	return { names: deduped, image: imageUrl };
}

export async function loadMoxfieldDeck(id: string): Promise<DeckLoadResult> {
	const res = await fetch(`/api/moxfield/${id}`);
	if (!res.ok) {
		throw new Error(`Failed to load deck (${res.status}).`);
	}

	const data = await res.json();
	const commanders = extractMoxfieldCommanders(data);

	return {
		name: data?.name ?? 'Untitled Deck',
		image: commanders.image,
		commanders: commanders.names
	};
}
