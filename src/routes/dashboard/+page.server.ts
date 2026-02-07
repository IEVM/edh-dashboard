// src/routes/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import {
	loadDatabase,
	getGamesJson,
	statsFromGames,
	type Games,
	type Stats
} from '$lib/data/restructure';

import { getSessionData } from '$lib/server/session';
import { getSheetsClient } from '$lib/server/google';
import { E2E_GAMES_SHEET } from '$lib/server/e2e-fixtures';

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
 * - Reads the selected spreadsheetId from the server session.
 * - Loads and parses the "Games" sheet.
 * - Computes global stats + per-deck usage and win rates.
 */
export const load: PageServerLoad = async ({ locals }): Promise<DashboardData> => {
	const sessionId = locals.sessionId;

	const spreadsheetId = (await getSessionData<string>(sessionId, 'databaseSheetId')) ?? null;

	if (!spreadsheetId) {
		return {
			spreadsheetId: null,
			error: 'No database selected. Go to Settings and choose a spreadsheet.',
			stats: null,
			deckStats: [],
			targetWinRate: 0
		};
	}

	const gamesSheet =
		env.E2E_TEST_MODE === '1'
			? E2E_GAMES_SHEET
			: (await loadDatabase(spreadsheetId, await getSheetsClient(sessionId), ['Games']))[0];
	const games: Games = getGamesJson(gamesSheet);

	if (!games.length) {
		return {
			spreadsheetId,
			error: 'No game data found in the Games sheet.',
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
		// If your sheet uses 1–4 "winner seat", this logic needs to change.
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
		spreadsheetId,
		stats,
		deckStats,
		targetWinRate
	};
};
