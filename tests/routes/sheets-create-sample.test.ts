import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	getTokens: vi.fn(),
	getSheetsClient: vi.fn()
}));

vi.mock('$lib/server/google', () => ({
	getTokens: mocks.getTokens,
	getSheetsClient: mocks.getSheetsClient
}));

import { POST } from '../../src/routes/api/sheets/create-sample/+server';

describe('POST /api/sheets/create-sample', () => {
	it('returns 401 when not authenticated', async () => {
		mocks.getTokens.mockResolvedValueOnce(undefined);

		const res = await POST({ locals: { sessionId: 's1' } } as any);

		expect(res.status).toBe(401);
		expect(mocks.getSheetsClient).not.toHaveBeenCalled();
	});
});
