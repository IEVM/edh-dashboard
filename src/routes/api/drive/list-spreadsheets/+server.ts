import type { RequestHandler } from './$types';
import { getDriveClient, getTokens } from '$lib/server/google';

export const GET: RequestHandler = async ({ locals }) => {
  const tokens = getTokens(locals.sessionId);
  if (!tokens) return new Response('Not authenticated', { status: 401 });

  const drive = getDriveClient(locals.sessionId);

  const res = await drive.files.list({
    q: "mimeType='application/vnd.google-apps.spreadsheet'",
    fields: 'files(id, name)'
  });

  return new Response(JSON.stringify(res.data.files ?? []), {
    headers: { 'Content-Type': 'application/json' }
  });
};
