import type { PageServerLoad } from './$types';
import { getSessionData } from '$lib/server/session';

/**
 * Loads the currently selected spreadsheet id from the server session.
 *
 * This is used by the Settings page to show which database is active (if any).
 */
export const load: PageServerLoad = async ({ locals }) => {
	const spreadsheetId = (await getSessionData(locals.sessionId, 'databaseSheetId')) ?? null;

	return { spreadsheetId };
};
