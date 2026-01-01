// src/routes/dashboard/+page.server.ts
import type { PageServerLoad } from './$types';
import {
  loadDatabase,
  getGamesJson,
  statsFromGames,
  type Games,
  type Stats
} from '$lib/data/restructure';

import { getSessionData } from '$lib/server/session';
import { getSheetsClient } from '$lib/server/google';

export type DeckStats = {
  name: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number; // 0–100
  usagePercent: number; // 0–100
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

  const spreadsheetId = getSessionData<string>(sessionId, 'databaseSheetId') ?? null;

  if (!spreadsheetId) {
    return {
      spreadsheetId: null,
      error: 'No database selected. Go to Settings and choose a spreadsheet.',
      stats: null,
      deckStats: [],
      targetWinRate: 0
    };
  }

  // Note: getSheetsClient is synchronous in your current implementation.
  // `await` does not hurt, but it can be removed for clarity.
  const sheetsClient = await getSheetsClient(sessionId);

  const [gamesSheet] = await loadDatabase(spreadsheetId, sheetsClient, ['Games']);
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

  // Aggregate per-deck games and wins.
  const deckMap = new Map<string, { games: number; wins: number }>();

  // Expected wins across all games assuming a fair game where each player has 1/N chance to win.
  // N is inferred from which "pXFun" fields are present.
  let expectedWins = 0;

  for (const g of games) {
    const deckName = typeof g.deck === 'string' ? g.deck.trim() : g.deck.deckName.trim();
    if (!deckName) continue;

    const current = deckMap.get(deckName) ?? { games: 0, wins: 0 };
    current.games += 1;

    // Current assumption: winner is a win/loss flag (1 = win, 0 = loss).
    // If your sheet uses 1–4 "winner seat", this logic needs to change.
    if (g.winner === 1) current.wins += 1;

    deckMap.set(deckName, current);

    // Infer table size from which fun columns were filled in.
    let players = 1;
    if (g.p2Fun !== null) players += 1;
    if (g.p3Fun !== null) players += 1;
    if (g.p4Fun !== null) players += 1;

    expectedWins += 1 / players;
  }

  const deckStats: DeckStats[] = [];
  for (const [name, { games: gCount, wins }] of deckMap.entries()) {
    const losses = Math.max(gCount - wins, 0);
    deckStats.push({
      name,
      games: gCount,
      wins,
      losses,
      winRate: gCount > 0 ? (wins / gCount) * 100 : 0,
      usagePercent: 0 // filled below
    });
  }

  const totalGames = games.length;
  const targetWinRate = totalGames > 0 ? (expectedWins / totalGames) * 100 : 0;

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
