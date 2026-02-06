import { describe, expect, it } from 'vitest';
import { getSessionData, hasSessionData, setSessionData } from '$lib/server/session';

const randomSessionId = () => `session-${Math.random().toString(16).slice(2)}`;

describe('session storage', () => {
  it('stores and retrieves values by session and key', () => {
    const sessionId = randomSessionId();

    setSessionData(sessionId, 'databaseSheetId', 'sheet-123');

    expect(getSessionData(sessionId, 'databaseSheetId')).toBe('sheet-123');
    expect(hasSessionData(sessionId, 'databaseSheetId')).toBe(true);
  });

  it('returns undefined for unknown keys', () => {
    const sessionId = randomSessionId();

    expect(getSessionData(sessionId, 'missing')).toBeUndefined();
    expect(hasSessionData(sessionId, 'missing')).toBe(false);
  });
});
