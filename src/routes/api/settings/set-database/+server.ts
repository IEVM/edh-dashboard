import type { RequestHandler } from './$types';
import { setSessionData } from '$lib/server/session';

export const POST: RequestHandler = async ({ request, locals }) => {
    const { spreadsheetId } = await request.json();

    if (!spreadsheetId)
        return new Response('Missing spreadsheetId', { status: 400 });

    // Store in session
    setSessionData(locals.sessionId, 'databaseSheetId', spreadsheetId);

    return new Response('ok');
};
