import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	hasTokens: vi.fn(),
	getSheetsClient: vi.fn()
}));

vi.mock('$lib/server/google', () => ({
	hasTokens: mocks.hasTokens,
	getSheetsClient: mocks.getSheetsClient
}));

import { GET } from '../../src/routes/api/sheets/read/+server';

describe('GET /api/sheets/read', () => {
	it('rejects when not authenticated', async () => {
		mocks.hasTokens.mockResolvedValueOnce(false);

		const event = {
			locals: { sessionId: 's1' },
			url: new URL('http://localhost/api/sheets/read?spreadsheetId=sheet-1')
		} as any;

		await expect(GET(event)).rejects.toMatchObject({ status: 401 });
	});

	it('rejects when spreadsheetId is missing', async () => {
		mocks.hasTokens.mockResolvedValueOnce(true);

		const event = {
			locals: { sessionId: 's1' },
			url: new URL('http://localhost/api/sheets/read')
		} as any;

		await expect(GET(event)).rejects.toMatchObject({ status: 400 });
	});

	it('returns values from the sheets client', async () => {
		mocks.hasTokens.mockResolvedValueOnce(true);
		mocks.getSheetsClient.mockResolvedValueOnce({
			spreadsheets: {
				values: {
					get: vi.fn().mockResolvedValue({
						data: {
							values: [
								[1, 2],
								[3, 4]
							]
						}
					})
				}
			}
		});

		const event = {
			locals: { sessionId: 's1' },
			url: new URL('http://localhost/api/sheets/read?spreadsheetId=sheet-1&range=Games!A1:B2')
		} as any;

		const res = await GET(event);

		expect(res.status).toBe(200);
		await expect(res.json()).resolves.toEqual({
			values: [
				[1, 2],
				[3, 4]
			]
		});
	});
});
