import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getTokens: vi.fn(),
  getDriveClient: vi.fn()
}));

vi.mock('$lib/server/google', () => ({
  getTokens: mocks.getTokens,
  getDriveClient: mocks.getDriveClient
}));

import { GET } from '../../src/routes/api/drive/list-spreadsheets/+server';

describe('GET /api/drive/list-spreadsheets', () => {
  it('returns 401 when not authenticated', async () => {
    mocks.getTokens.mockResolvedValueOnce(undefined);

    const res = await GET({ locals: { sessionId: 's1' } } as any);

    expect(res.status).toBe(401);
  });

  it('returns spreadsheet list when authenticated', async () => {
    mocks.getTokens.mockResolvedValueOnce({ access_token: 'token' });
    mocks.getDriveClient.mockResolvedValueOnce({
      files: {
        list: vi.fn().mockResolvedValue({
          data: { files: [{ id: 'sheet-1', name: 'EDH DB' }] }
        })
      }
    });

    const res = await GET({ locals: { sessionId: 's1' } } as any);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual([{ id: 'sheet-1', name: 'EDH DB' }]);
  });
});
