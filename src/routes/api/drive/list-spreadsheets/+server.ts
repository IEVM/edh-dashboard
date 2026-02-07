import type { RequestHandler } from './$types';
import { getDriveClient, getTokens } from '$lib/server/google';

/**
 * Lists Google Drive spreadsheets visible to the authenticated user.
 *
 * Returns a JSON array of `{ id, name }` objects.
 * Responds with 401 if the user is not authenticated.
 */
export const GET: RequestHandler = async ({ locals }) => {
	const tokens = await getTokens(locals.sessionId);
	if (!tokens) return new Response('Not authenticated', { status: 401 });

	const drive = await getDriveClient(locals.sessionId);

	const res = await drive.files.list({
		q: "mimeType='application/vnd.google-apps.spreadsheet'",
		fields: 'files(id, name)'
	});

	return new Response(JSON.stringify(res.data.files ?? []), {
		headers: { 'Content-Type': 'application/json' }
	});
};
