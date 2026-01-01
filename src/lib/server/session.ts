type SessionData = Record<string, unknown>;

// Simple in-memory session storage (per user session)
const sessionData = new Map<string, SessionData>();

export function setSessionData(sessionId: string, key: string, value: unknown) {
    const data = sessionData.get(sessionId) ?? {};
    data[key] = value;
    sessionData.set(sessionId, data);
}

export function getSessionData<T = unknown>(sessionId: string, key: string): T | undefined {
    const data = sessionData.get(sessionId);
    return data ? (data[key] as T) : undefined;
}

export function hasSessionData(sessionId: string, key: string) {
    const data = sessionData.get(sessionId);
    return data ? key in data : false;
}
