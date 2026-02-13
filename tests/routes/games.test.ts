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

import { POST as appendGame } from '../../src/routes/api/games/append/+server';
import { POST as updateGame } from '../../src/routes/api/games/update/+server';
import { POST as deleteGame } from '../../src/routes/api/games/delete/+server';

describe('POST /api/games/append', () => {
	it('returns 400 when deckName is missing', async () => {
		mocks.getDataManager.mockResolvedValueOnce({ appendGame: vi.fn() });

		const request = new Request('http://localhost/api/games/append', {
			method: 'POST',
			body: JSON.stringify({})
		});

		const res = await appendGame({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(400);
	});

	it('appends a game', async () => {
		const appendGameMock = vi.fn().mockResolvedValueOnce({});
		mocks.getDataManager.mockResolvedValueOnce({ appendGame: appendGameMock });

		const request = new Request('http://localhost/api/games/append', {
			method: 'POST',
			body: JSON.stringify({ deckName: 'Deck A', winner: 1 })
		});

		const res = await appendGame({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(200);
		expect(appendGameMock).toHaveBeenCalled();
	});
});

describe('POST /api/games/update', () => {
	it('returns 400 when deckName is missing', async () => {
		mocks.getDataManager.mockResolvedValueOnce({ updateGame: vi.fn() });

		const request = new Request('http://localhost/api/games/update', {
			method: 'POST',
			body: JSON.stringify({ gameId: 'game-1' })
		});

		const res = await updateGame({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(400);
	});

	it('updates a game', async () => {
		const updateGameMock = vi.fn().mockResolvedValueOnce({});
		mocks.getDataManager.mockResolvedValueOnce({ updateGame: updateGameMock });

		const request = new Request('http://localhost/api/games/update', {
			method: 'POST',
			body: JSON.stringify({ gameId: 'game-1', deckName: 'Deck A', winner: 1 })
		});

		const res = await updateGame({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(200);
		expect(updateGameMock).toHaveBeenCalled();
	});
});

describe('POST /api/games/delete', () => {
	it('returns 400 when gameId is missing', async () => {
		mocks.getDataManager.mockResolvedValueOnce({ deleteGame: vi.fn() });

		const request = new Request('http://localhost/api/games/delete', {
			method: 'POST',
			body: JSON.stringify({})
		});

		const res = await deleteGame({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(400);
	});

	it('deletes a game', async () => {
		const deleteGameMock = vi.fn().mockResolvedValueOnce({});
		mocks.getDataManager.mockResolvedValueOnce({ deleteGame: deleteGameMock });

		const request = new Request('http://localhost/api/games/delete', {
			method: 'POST',
			body: JSON.stringify({ gameId: 'game-1' })
		});

		const res = await deleteGame({ locals: { sessionId: 's1' }, request } as any);

		expect(res.status).toBe(200);
		expect(deleteGameMock).toHaveBeenCalledWith('game-1');
	});
});
