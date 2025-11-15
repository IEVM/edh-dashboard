import type { PageServerLoad } from './$types';
import { getSessionData } from '$lib/server/session';

export const load: PageServerLoad = async ({ locals }) => {
    // Read the previously chosen database spreadsheet ID from the session
    const spreadsheetId = getSessionData(locals.sessionId, 'databaseSheetId') ?? null;

    return {
        spreadsheetId
    };
};
