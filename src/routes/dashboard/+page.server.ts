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
				stats: null,
				deckStats: [],
				targetWinRate: 0
			};
		}

		const targetWinRate = stats.expectedWinrate * 100;

		return {
			stats,
			deckStats,
			targetWinRate
		};
	} catch (err) {
		if (err instanceof DataManagerError) {
			return {
				error: err.message,
				stats: null,
				deckStats: [],
				targetWinRate: 0
			};
		}

		return {
			error: 'Unexpected error while loading dashboard.',
			stats: null,
			deckStats: [],
			targetWinRate: 0
		};
	}
};
