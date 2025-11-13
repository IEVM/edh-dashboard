import { google } from 'googleapis';
import type { RequestHandler } from './$types';
import { getTokens } from '$lib/server/google';

export const POST: RequestHandler = async ({ locals }) => {
    const tokens = getTokens(locals.sessionId);
    if (!tokens) return new Response('Not authenticated', { status: 401 });

    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);

    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.create({
        requestBody: {
            properties: { title: 'EDH Deck Database' },
            sheets: [{ properties: { title: 'Decks' } }]
        }
    });

    return new Response(JSON.stringify(res.data));
};
