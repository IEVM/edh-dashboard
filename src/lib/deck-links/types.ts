export type DeckProvider = 'archidekt' | 'moxfield';

export type ParsedDeckLink = {
	url: string | null;
	provider: DeckProvider | null;
	id: string | null;
	label: string | null;
	error: string | null;
};

export type DeckLoadResult = {
	name: string;
	image: string;
	commanders: string[];
};
