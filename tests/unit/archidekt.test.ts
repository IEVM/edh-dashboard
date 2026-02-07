import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadArchidektDeck } from '$lib/deck-links/archidekt';
import { parseUrl } from '$lib/deck-links/parse';

type MockResponse = {
	ok: boolean;
	status: number;
	json: () => Promise<unknown>;
};

function mockFetchOnce(payload: unknown, ok = true, status = 200) {
	const res: MockResponse = {
		ok,
		status,
		json: async () => payload
	};
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => res)
	);
}

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('parseUrl (Archidekt)', () => {
	it('parses a valid Archidekt URL', () => {
		const parsed = parseUrl('https://archidekt.com/decks/1234567/some-deck');

		expect(parsed.provider).toBe('archidekt');
		expect(parsed.id).toBe('1234567');
		expect(parsed.label).toBe('Archidekt');
		expect(parsed.error).toBeNull();
	});
});

describe('loadArchidektDeck', () => {
	it('extracts name, image, and commander names', async () => {
		mockFetchOnce({
			name: 'Test Archidekt Deck',
			featured: 'https://images.example/archidekt.jpg',
			categories: [
				{
					name: 'Commander',
					cards: [
						{ card: { oracleCard: { name: "Atraxa, Praetors' Voice" } } },
						{ card: { oracle_card: { name: "Atraxa, Praetors' Voice" } } }
					]
				}
			]
		});

		const data = await loadArchidektDeck('1234567');

		expect(data.name).toBe('Test Archidekt Deck');
		expect(data.image).toBe('https://images.example/archidekt.jpg');
		expect(data.commanders).toEqual(["Atraxa, Praetors' Voice"]);
		expect(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
			'/api/archidekt/1234567'
		);
	});

	it('throws when the API response is not ok', async () => {
		mockFetchOnce({}, false, 500);

		await expect(loadArchidektDeck('999999')).rejects.toThrow('Failed to load deck (500).');
	});
});
