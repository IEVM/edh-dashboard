import { google } from 'googleapis';
import type { RequestHandler } from './$types';
import { getTokens } from '$lib/server/google';

export const GET: RequestHandler = async ({ locals }) => {
    const tokens = getTokens(locals.sessionId);
    if (!tokens) return new Response('Not authenticated', { status: 401 });

    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);

    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name)'
    });

    return new Response(JSON.stringify(res.data.files ?? []));
};
