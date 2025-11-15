import { google } from 'googleapis';
import type { Credentials } from 'google-auth-library';
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
} from '$env/static/private';

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

// DEV-ONLY: token storage in memory, per sessionId
const tokenStore = new Map<string, Credentials>();

function createOAuthClient() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl() {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

export async function handleAuthCode(sessionId: string, code: string) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  tokenStore.set(sessionId, tokens);

  return tokens;
}

export function saveTokens(sessionId: string, tokens: Credentials) {
  tokenStore.set(sessionId, tokens);
}

export function getTokens(sessionId: string) {
  return tokenStore.get(sessionId);
}

export function hasTokens(sessionId: string) {
  return tokenStore.has(sessionId);
}

export function getSheetsClient(sessionId: string) {
  const tokens = tokenStore.get(sessionId);
  if (!tokens) {
    throw new Error('Not authenticated');
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export function getDriveClient(sessionId: string) {
  const tokens = tokenStore.get(sessionId);
  if (!tokens) {
    throw new Error('Not authenticated');
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);

  return google.drive({ version: 'v3', auth: oauth2Client });
}

