import type { DeckLoadResult } from './types';

function extractArchidektCommanders(deck: any): string[] {
	if (!deck || !Array.isArray(deck.categories)) return [];

	const commanderCategory =
		deck.categories.find(
			(c: any) => typeof c.name === 'string' && c.name.toLowerCase().includes('commander')
		) ?? null;

	if (!commanderCategory || !Array.isArray(commanderCategory.cards)) return [];

	const names = commanderCategory.cards
		.map((entry: any) => entry?.card?.oracleCard?.name ?? entry?.card?.oracle_card?.name ?? null)
		.filter((n: string | null): n is string => !!n);

	return Array.from(new Set(names));
}

export async function loadArchidektDeck(id: string): Promise<DeckLoadResult> {
	const res = await fetch(`/api/archidekt/${id}`);
	if (!res.ok) {
		throw new Error(`Failed to load deck (${res.status}).`);
	}

	const data = await res.json();
	return {
		name: data?.name ?? 'Untitled Deck',
		image: data?.featured ?? '',
		commanders: extractArchidektCommanders(data)
	};
}
