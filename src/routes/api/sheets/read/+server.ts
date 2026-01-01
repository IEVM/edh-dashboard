import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { getSheetsClient, hasTokens } from '$lib/server/google';

/**
 * Reads a range from a Google Spreadsheet and returns its raw cell values.
 *
 * Query params:
 * - `spreadsheetId` (required)
 * - `range` (optional, defaults to `Sheet1!A1:D10`)
 */
export async function GET(event: RequestEvent) {
  const sessionId = event.locals.sessionId;

  if (!hasTokens(sessionId)) {
    throw error(401, 'Not authenticated with Google');
  }

  const spreadsheetId = event.url.searchParams.get('spreadsheetId');
  const range = event.url.searchParams.get('range') ?? 'Sheet1!A1:D10';

  if (!spreadsheetId) {
    throw error(400, 'Missing spreadsheetId query parameter');
  }

  const sheets = getSheetsClient(sessionId);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range
  });

  return json({ values: res.data.values ?? [] });
}
