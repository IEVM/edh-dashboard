import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	setSessionData: vi.fn()
}));

vi.mock('$lib/server/session', () => ({
	setSessionData: mocks.setSessionData
}));

import { POST } from '../../src/routes/api/settings/set-database/+server';

describe('POST /api/settings/set-database', () => {
	it('returns 400 when spreadsheetId is missing', async () => {
		const request = new Request('http://localhost/api/settings/set-database', {
			method: 'POST',
			body: JSON.stringify({})
		});

		const res = await POST({ request, locals: { sessionId: 's1' } } as any);

		expect(res.status).toBe(400);
	});

	it('stores spreadsheetId in session and returns ok', async () => {
		mocks.setSessionData.mockResolvedValueOnce(undefined);
		const request = new Request('http://localhost/api/settings/set-database', {
			method: 'POST',
			body: JSON.stringify({ spreadsheetId: 'sheet-123' })
		});

		const res = await POST({ request, locals: { sessionId: 's1' } } as any);

		expect(res.status).toBe(200);
		expect(mocks.setSessionData).toHaveBeenCalledWith('s1', 'databaseSheetId', 'sheet-123');
	});
});
