import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getDataManager: vi.fn()
}));

vi.mock('$lib/server/data-manager', async () => {
	const actual = await vi.importActual<typeof import('$lib/server/data-manager')>(
		'$lib/server/data-manager'
	);
	return { ...actual, getDataManager: mocks.getDataManager };
});

import { POST as appendDeck } from '../../src/routes/api/decks/append/+server';
import { POST as updateDeck } from '../../src/routes/api/decks/update/+server';
import { POST as deleteDeck } from '../../src/routes/api/decks/delete/+server';
import { DataManagerError } from '$lib/server/data-manager';

describe('POST /api/decks/append', () => {
	it('returns 401 when not authenticated', async () => {
		mocks.getDataManager.mockRejectedValueOnce(new DataManagerError('Not authenticated', 401));

		const res = await appendDeck({ locals: { sessionId: 's1' } } as any);

		expect(res.status).toBe(401);
	});

	it('returns 400 when deckName is missing', async () => {
		mocks.getDataManager.mockResolvedValueOnce({ appendDeck: vi.fn() });

		const request = new Request('http://localhost/api/decks/append', {
			method: 'POST',
			body: JSON.stringify({})
		});

		const res = await appendDeck({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(400);
	});

	it('appends a deck', async () => {
		const appendDeckMock = vi.fn().mockResolvedValueOnce({});
		mocks.getDataManager.mockResolvedValueOnce({ appendDeck: appendDeckMock });

		const request = new Request('http://localhost/api/decks/append', {
			method: 'POST',
			body: JSON.stringify({ deckName: 'Deck A', targetBracket: 3 })
		});

		const res = await appendDeck({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(200);
		expect(appendDeckMock).toHaveBeenCalled();
	});
});

describe('POST /api/decks/update', () => {
	it('returns 400 when originalName is missing', async () => {
		mocks.getDataManager.mockResolvedValueOnce({ updateDeck: vi.fn() });

		const request = new Request('http://localhost/api/decks/update', {
			method: 'POST',
			body: JSON.stringify({ deckId: 'deck-1', deckName: 'Deck A' })
		});

		const res = await updateDeck({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(400);
	});

	it('updates a deck', async () => {
		const updateDeckMock = vi.fn().mockResolvedValueOnce({});
		mocks.getDataManager.mockResolvedValueOnce({ updateDeck: updateDeckMock });

		const request = new Request('http://localhost/api/decks/update', {
			method: 'POST',
			body: JSON.stringify({
				deckId: 'deck-1',
				originalName: 'Old Deck',
				deckName: 'New Deck'
			})
		});

		const res = await updateDeck({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(200);
		expect(updateDeckMock).toHaveBeenCalled();
	});
});

describe('POST /api/decks/delete', () => {
	it('deletes deck and matching games', async () => {
		const deleteDeckMock = vi.fn().mockResolvedValueOnce(1);
		mocks.getDataManager.mockResolvedValueOnce({ deleteDeck: deleteDeckMock });

		const request = new Request('http://localhost/api/decks/delete', {
			method: 'POST',
			body: JSON.stringify({ deckId: 'deck-1', deckName: 'Deck A' })
		});

		const res = await deleteDeck({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(200);
		expect(deleteDeckMock).toHaveBeenCalledWith('deck-1', 'Deck A');
	});
});
