type SessionData = Record<string, unknown>;

// Simple in-memory session storage (per user session)
const sessionData = new Map<string, SessionData>();

export function setSessionData(sessionId: string, key: string, value: unknown) {
    const data = sessionData.get(sessionId) ?? {};
    data[key] = value;
    sessionData.set(sessionId, data);
}

export function getSessionData(sessionId: string, key: string) {
    const data = sessionData.get(sessionId);
    return data ? data[key] : undefined;
}

export function hasSessionData(sessionId: string, key: string) {
    const data = sessionData.get(sessionId);
    return data ? key in data : false;
}
