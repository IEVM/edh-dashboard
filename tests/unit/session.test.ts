import { describe, expect, it } from 'vitest';
import { getSessionData, hasSessionData, setSessionData } from '$lib/server/session';

const randomSessionId = () => `session-${Math.random().toString(16).slice(2)}`;

describe('session storage', () => {
	it('stores and retrieves values by session and key', async () => {
		const sessionId = randomSessionId();

		await setSessionData(sessionId, 'databaseSheetId', 'sheet-123');

		await expect(getSessionData(sessionId, 'databaseSheetId')).resolves.toBe('sheet-123');
		await expect(hasSessionData(sessionId, 'databaseSheetId')).resolves.toBe(true);
	});

	it('returns undefined for unknown keys', async () => {
		const sessionId = randomSessionId();

		await expect(getSessionData(sessionId, 'missing')).resolves.toBeUndefined();
		await expect(hasSessionData(sessionId, 'missing')).resolves.toBe(false);
	});
});
