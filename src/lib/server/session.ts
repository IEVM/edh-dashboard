type SessionData = Record<string, unknown>;

// Simple in-memory session storage (per user session)
const sessionData = new Map<string, SessionData>();

/**
 * Stores a value for a given session under a key.
 *
 * Note: This is in-memory only. Data is lost on server restart and won't be shared across instances.
 *
 * @param sessionId User/session identifier
 * @param key       Property name within the session object
 * @param value     Any serializable value you want to keep for the session lifetime
 */
export function setSessionData(sessionId: string, key: string, value: unknown) {
  const data = sessionData.get(sessionId) ?? {};
  data[key] = value;
  sessionData.set(sessionId, data);
}

/**
 * Reads a session value by key.
 *
 * @param sessionId User/session identifier
 * @param key       Property name within the session object
 * @returns         The stored value (typed via generic), or undefined if missing
 */
export function getSessionData<T = unknown>(sessionId: string, key: string): T | undefined {
  const data = sessionData.get(sessionId);
  return data ? (data[key] as T) : undefined;
}

/**
 * Checks whether a given session has a value stored under `key`.
 *
 * @param sessionId User/session identifier
 * @param key       Property name within the session object
 */
export function hasSessionData(sessionId: string, key: string) {
  const data = sessionData.get(sessionId);
  return data ? key in data : false;
}
