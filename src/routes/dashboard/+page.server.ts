// src/routes/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { statsFromGames, type Games, type Stats } from '$lib/data/restructure';
import { DataManagerError, getDataManager } from '$lib/server/data-manager';

export type DeckStats = {
	name: string;
	games: number;
	wins: number;
	losses: number;
	winRate: number; // 0–100
	usagePercent: number; // 0–100
	avgFunSelf: number | null;
	avgFunOthers: number | null;
};

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
		const manager = await getDataManager(locals.sessionId as string);
		const games: Games = await manager.getGames();

		if (!games.length) {
			return {
				spreadsheetId: manager.spreadsheetId,
				error: 'No game data found yet.',
				stats: null,
				deckStats: [],
				targetWinRate: 0
			};
		}

		const stats = statsFromGames(games);

		const average = (values: number[]) => {
			if (!values.length) return null;
			const sum = values.reduce((acc, v) => acc + v, 0);
			return sum / values.length;
		};

		// Aggregate per-deck games, wins, and fun scores.
		const deckMap = new Map<
			string,
			{ games: number; wins: number; funSelf: number[]; funOthers: number[] }
		>();

		for (const g of games) {
			const deckName = typeof g.deck === 'string' ? g.deck.trim() : g.deck.deckName.trim();
			if (!deckName) continue;

			const current = deckMap.get(deckName) ?? {
				games: 0,
				wins: 0,
				funSelf: [],
				funOthers: []
			};
			current.games += 1;

			// Current assumption: winner is a win/loss flag (1 = win, 0 = loss).
			// If your data uses 1–4 "winner seat", this logic needs to change.
			if (g.winner === 1) current.wins += 1;

			if (g.fun !== null) current.funSelf.push(g.fun);
			if (g.p2Fun !== null) current.funOthers.push(g.p2Fun);
			if (g.p3Fun !== null) current.funOthers.push(g.p3Fun);
			if (g.p4Fun !== null) current.funOthers.push(g.p4Fun);

			deckMap.set(deckName, current);
		}

		const deckStats: DeckStats[] = [];
		for (const [name, { games: gCount, wins, funSelf, funOthers }] of deckMap.entries()) {
			const losses = Math.max(gCount - wins, 0);
			deckStats.push({
				name,
				games: gCount,
				wins,
				losses,
				winRate: gCount > 0 ? (wins / gCount) * 100 : 0,
				usagePercent: 0, // filled below
				avgFunSelf: average(funSelf),
				avgFunOthers: average(funOthers)
			});
		}

		const targetWinRate = stats ? stats.expectedWinrate * 100 : 0;

		const totalGamesForUsage = deckStats.reduce((sum, d) => sum + d.games, 0);
		for (const deck of deckStats) {
			deck.usagePercent = totalGamesForUsage > 0 ? (deck.games / totalGamesForUsage) * 100 : 0;
		}

		deckStats.sort((a, b) => b.games - a.games);

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
