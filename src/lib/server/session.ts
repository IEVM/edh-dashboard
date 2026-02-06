import { kvGet, kvSet } from './kv';

type SessionData = Record<string, unknown>;

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const sessionKey = (sessionId: string) => `session:${sessionId}`;

/**
 * Stores a value for a given session under a key.
 *
 * Note: Stored in KV when configured, with an in-memory fallback for local dev.
 *
 * @param sessionId User/session identifier
 * @param key       Property name within the session object
 * @param value     Any serializable value you want to keep for the session lifetime
 */
export async function setSessionData(sessionId: string, key: string, value: unknown) {
  const data = (await kvGet<SessionData>(sessionKey(sessionId))) ?? {};
  data[key] = value;
  await kvSet(sessionKey(sessionId), data, SESSION_TTL_SECONDS);
}

/**
 * Reads a session value by key.
 *
 * @param sessionId User/session identifier
 * @param key       Property name within the session object
 * @returns         The stored value (typed via generic), or undefined if missing
 */
export async function getSessionData<T = unknown>(
  sessionId: string,
  key: string
): Promise<T | undefined> {
  const data = await kvGet<SessionData>(sessionKey(sessionId));
  return data ? (data[key] as T) : undefined;
}

/**
 * Checks whether a given session has a value stored under `key`.
 *
 * @param sessionId User/session identifier
 * @param key       Property name within the session object
 */
export async function hasSessionData(sessionId: string, key: string) {
  const data = await kvGet<SessionData>(sessionKey(sessionId));
  return data ? key in data : false;
}
