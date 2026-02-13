import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import { env } from '$env/dynamic/private';
import { kvDelete, kvGet, kvSet } from './kv';
import { getSessionData, setSessionData } from './session';

export type UserProfile = {
	id: string;
	email: string | null;
	name: string | null;
	picture: string | null;
};

const SCOPES = [
	'openid',
	'email',
	'profile'
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

async function fetchUserProfile(oauth2Client: ReturnType<typeof createOAuthClient>) {
	const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
	const { data } = await oauth2.userinfo.get();

	return {
		id: data.id ?? '',
		email: data.email ?? null,
		name: data.name ?? null,
		picture: data.picture ?? null
	} satisfies UserProfile;
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

	oauth2Client.setCredentials(tokens);
	const profile = await fetchUserProfile(oauth2Client);

	if (profile.id) {
		await setSessionData(sessionId, 'userProfile', profile);
	}

	return tokens;
}

export async function ensureUserProfile(sessionId: string): Promise<UserProfile | null> {
	const existing = await getSessionData<UserProfile>(sessionId, 'userProfile');
	if (existing?.id) return existing;

	const tokens = await getTokens(sessionId);
	if (!tokens) return null;

	const oauth2Client = createOAuthClient();
	oauth2Client.setCredentials(tokens);
	const profile = await fetchUserProfile(oauth2Client);

	if (profile.id) {
		await setSessionData(sessionId, 'userProfile', profile);
		return profile;
	}

	return null;
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

// Google Sheets / Drive clients removed (we now use Postgres).
