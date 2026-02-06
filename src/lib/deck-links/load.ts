import type { DeckLoadResult, ParsedDeckLink } from './types';
import { loadArchidektDeck } from './archidekt';
import { loadMoxfieldDeck } from './moxfield';

export async function loadDeckData(link: ParsedDeckLink): Promise<DeckLoadResult> {
	if (!link.provider || !link.id) {
		throw new Error('Missing deck provider or id.');
	}

	switch (link.provider) {
		case 'archidekt':
			return loadArchidektDeck(link.id);
		case 'moxfield':
			return loadMoxfieldDeck(link.id);
		default:
			throw new Error('Unsupported deck provider.');
	}
}
