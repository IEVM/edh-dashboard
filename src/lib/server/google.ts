import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import { env } from '$env/dynamic/private';
import { kvDelete, kvGet, kvSet } from './kv';

const SCOPES = [
	'openid',
	'email',
	'profile',
	'https://www.googleapis.com/auth/drive.metadata.readonly',
	'https://www.googleapis.com/auth/spreadsheets',
	'https://www.googleapis.com/auth/drive.file'
];

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;
const tokensKey = (sessionId: string) => `google:tokens:${sessionId}`;

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

	await kvSet(tokensKey(sessionId), tokens, TOKEN_TTL_SECONDS);

	return tokens;
}

/**
 * Stores a token bundle for a given sessionId.
 * Useful if you refresh tokens elsewhere and want to persist the updated set.
 */
export async function saveTokens(sessionId: string, tokens: Credentials) {
	await kvSet(tokensKey(sessionId), tokens, TOKEN_TTL_SECONDS);
}

/** Clears any stored tokens for a session. */
export async function clearTokens(sessionId: string) {
	await kvDelete(tokensKey(sessionId));
}

/** @returns tokens for a session or undefined if not authenticated. */
export async function getTokens(sessionId: string) {
	return await kvGet<Credentials>(tokensKey(sessionId));
}

/** @returns true if we have tokens stored for this session. */
export async function hasTokens(sessionId: string) {
	const tokens = await getTokens(sessionId);
	return !!tokens;
}

/**
 * Returns a configured Google Sheets API client for the given session.
 *
 * @throws Error if no tokens are stored for this sessionId.
 */
export async function getSheetsClient(sessionId: string) {
	const tokens = await getTokens(sessionId);
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
export async function getDriveClient(sessionId: string) {
	const tokens = await getTokens(sessionId);
	if (!tokens) {
		throw new Error('Not authenticated');
	}

	const oauth2Client = createOAuthClient();
	oauth2Client.setCredentials(tokens);

	return google.drive({ version: 'v3', auth: oauth2Client });
}
