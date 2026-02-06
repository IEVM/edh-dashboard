import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import { env } from '$env/dynamic/private';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const tokenStore = new Map<string, Credentials>();

/**
 * Creates a new OAuth2 client configured with this app's Google credentials.
 *
 * Note: This is stateless; credentials (tokens) are applied per request via `setCredentials`.
 */
function createOAuthClient() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Builds the Google OAuth consent screen URL to initiate the auth flow.
 *
 * Uses `offline` + `prompt: consent` to request a refresh token reliably.
 *
 * @returns URL to redirect the user to for Google sign-in/consent.
 */
export function getAuthUrl() {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

/**
 * Exchanges an OAuth `code` for tokens and stores them under the given sessionId.
 *
 * @param sessionId App session identifier used as the key in the token store.
 * @param code      OAuth authorization code returned by Google.
 * @returns         The token bundle returned by Google (access/refresh/etc).
 */
export async function handleAuthCode(sessionId: string, code: string) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  tokenStore.set(sessionId, tokens);

  return tokens;
}

/**
 * Stores a token bundle for a given sessionId.
 * Useful if you refresh tokens elsewhere and want to persist the updated set.
 */
export function saveTokens(sessionId: string, tokens: Credentials) {
  tokenStore.set(sessionId, tokens);
}

/** @returns tokens for a session or undefined if not authenticated. */
export function getTokens(sessionId: string) {
  return tokenStore.get(sessionId);
}

/** @returns true if we have tokens stored for this session. */
export function hasTokens(sessionId: string) {
  return tokenStore.has(sessionId);
}

/**
 * Returns a configured Google Sheets API client for the given session.
 *
 * @throws Error if no tokens are stored for this sessionId.
 */
export function getSheetsClient(sessionId: string) {
  const tokens = tokenStore.get(sessionId);
  if (!tokens) {
    throw new Error('Not authenticated');
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

/**
 * Returns a configured Google Drive API client for the given session.
 *
 * @throws Error if no tokens are stored for this sessionId.
 */
export function getDriveClient(sessionId: string) {
  const tokens = tokenStore.get(sessionId);
  if (!tokens) {
    throw new Error('Not authenticated');
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);

  return google.drive({ version: 'v3', auth: oauth2Client });
}
