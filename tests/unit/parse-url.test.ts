import { describe, expect, it } from 'vitest';
import { parseUrl } from '$lib/deck-links/parse';

describe('parseUrl', () => {
	it('returns nulls when the url is empty or placeholder', () => {
		expect(parseUrl(null)).toEqual({
			url: null,
			provider: null,
			id: null,
			label: null,
			error: null
		});

		expect(parseUrl('   ')).toEqual({
			url: null,
			provider: null,
			id: null,
			label: null,
			error: null
		});

		expect(parseUrl('-')).toEqual({
			url: null,
			provider: null,
			id: null,
			label: null,
			error: null
		});
	});

	it('flags unsupported providers', () => {
		const result = parseUrl('https://example.com/decks/123');
		expect(result.provider).toBeNull();
		expect(result.error).toBe('Unsupported deck link.');
	});

	it('parses archidekt and moxfield urls with extra path or query', () => {
		const archidekt = parseUrl('https://archidekt.com/decks/12345/alpha?ref=1');
		expect(archidekt.provider).toBe('archidekt');
		expect(archidekt.id).toBe('12345');

		const moxfield = parseUrl('https://moxfield.com/decks/AbC_123?utm=1');
		expect(moxfield.provider).toBe('moxfield');
		expect(moxfield.id).toBe('AbC_123');
	});
});
