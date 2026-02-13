// src/routes/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import type { Stats } from '$lib/data/restructure';
import {
	DataManagerError,
	getDataManager,
	type DeckStatsRow
} from '$lib/server/data-manager';

export type DeckStats = DeckStatsRow;

type DashboardData = {
	spreadsheetId: string | null;
	error?: string;
	stats: Stats | null;
	deckStats: DeckStats[];
	targetWinRate: number; // 0–100
};

/**
 * Server-side loader for the overall dashboard.
 *
 * - Loads games from the active data backend.
 * - Computes global stats + per-deck usage and win rates.
 */
export const load: PageServerLoad = async ({ locals }): Promise<DashboardData> => {
	try {
		const manager = await getDataManager(locals);
		const { stats, deckStats } = await manager.getDashboardStats();

		if (!stats) {
			return {
				spreadsheetId: manager.spreadsheetId,
				error: 'No game data found yet.',
				stats: null,
				deckStats: [],
				targetWinRate: 0
			};
		}

		const targetWinRate = stats.expectedWinrate * 100;

		return {
			spreadsheetId: manager.spreadsheetId,
			stats,
			deckStats,
			targetWinRate
		};
	} catch (err) {
		if (err instanceof DataManagerError) {
			return {
				spreadsheetId: null,
				error: err.message,
				stats: null,
				deckStats: [],
				targetWinRate: 0
			};
		}

		return {
			spreadsheetId: null,
			error: 'Unexpected error while loading dashboard.',
			stats: null,
			deckStats: [],
			targetWinRate: 0
		};
	}
};
