import type { PageServerLoad } from './$types';
import { getSheetsClient } from '$lib/server/google';
import { getSessionData } from '$lib/server/session';

type DeckMeta = {
  name: string;
  targetBracket: number | null;
  summary: string | null;
  archidektLink: string | null;
};

type DeckGame = {
  deck: string;
  winner: number | null;
  fun: number | null;
  p2Fun: number | null;
  p3Fun: number | null;
  p4Fun: number | null;
  notes: string | null;
  estBracket: number | null;
};

export const load: PageServerLoad = async ({ locals, params }) => {
  const rawParam = params.deckName;
  const deckName = decodeURIComponent(rawParam);

  const spreadsheetId =
    getSessionData(locals.sessionId, 'databaseSheetId') ?? null;

  if (!spreadsheetId) {
    return {
      deckName,
      spreadsheetId: null,
      error: 'No database selected. Go to Settings first.'
    };
  }

  const sheets = getSheetsClient(locals.sessionId);

  // Load Decks + Games in parallel
  const [decksRes, gamesRes] = await Promise.all([
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId as string,
      range: 'Decks!A1:D200'
    }),
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId as string,
      range: 'Games!A1:H2000'
    })
  ]);

  const decksValues = decksRes.data.values ?? [];
  const gamesValues = gamesRes.data.values ?? [];

  // Parse Decks header
  let deckMeta: DeckMeta = {
    name: deckName,
    targetBracket: null,
    summary: null,
    archidektLink: null
  };

  if (decksValues.length > 1) {
    const headers = decksValues[0].map((h) => String(h ?? '').toLowerCase().trim());
    const idxName = headers.indexOf('name');
    const idxTarget = headers.indexOf('target bracket');
    const idxSummary = headers.indexOf('summary');
    const idxLink = headers.indexOf('archidekt link');

    const deckRow = decksValues.slice(1).find((row) => {
      const n = idxName >= 0 ? String(row[idxName] ?? '').trim() : '';
      return n === deckName;
    });

    if (deckRow) {
      deckMeta = {
        name: deckName,
        targetBracket:
          idxTarget >= 0 ? Number(deckRow[idxTarget] ?? '') || null : null,
        summary:
          idxSummary >= 0
            ? String(deckRow[idxSummary] ?? '') || null
            : null,
        archidektLink:
          idxLink >= 0
            ? String(deckRow[idxLink] ?? '') || null
            : null
      };
    }
  }

  // Parse Games header
  const deckGames: DeckGame[] = [];
  let totalGames = 0;
  let wins = 0;
  let playersPlayed = 0;
  let expectedWinrate = 0;

  // collections for stats
  const funSelfValues: number[] = [];
  const funSelfWins: number[] = [];
  const funSelfLosses: number[] = [];
  const funOthersValues: number[] = [];
  const estBracketValues: number[] = [];

  if (gamesValues.length > 1) {
    const headers = gamesValues[0].map((h) => String(h ?? '').toLowerCase().trim());
    const idxDeck = headers.indexOf('deck');
    const idxWinner = headers.indexOf('winner');
    const idxFun = headers.indexOf('fun');
    const idxP2 = headers.indexOf('p2 fun');
    const idxP3 = headers.indexOf('p3 fun');
    const idxP4 = headers.indexOf('p4 fun');
    const idxNotes = headers.indexOf('notes');
    const idxEst = headers.indexOf('est. pod bracket');

    for (const row of gamesValues.slice(1)) {
      const rowDeck =
        idxDeck >= 0 ? String(row[idxDeck] ?? '').trim() : '';

      if (rowDeck !== deckName) continue;

      const winnerRaw = idxWinner >= 0 ? row[idxWinner] : null;
      const winnerNum =
        winnerRaw != null && String(winnerRaw).trim() !== ''
          ? Number(winnerRaw)
          : null;

      const funNum =
        idxFun >= 0 ? Number(row[idxFun] ?? '') || null : null;
      const p2Num =
        idxP2 >= 0 ? Number(row[idxP2] ?? '') || null : null;
      const p3Num =
        idxP3 >= 0 ? Number(row[idxP3] ?? '') || null : null;
      const p4Num =
        idxP4 >= 0 ? Number(row[idxP4] ?? '') || null : null;
      const estNum =
        idxEst >= 0 ? Number(row[idxEst] ?? '') || null : null;

      const notesVal =
        idxNotes >= 0 ? String(row[idxNotes] ?? '') || null : null;

      totalGames += 1;
      // same win logic as dashboard: winner === 1 => your deck won
      if (winnerNum === 1) wins += 1;

      // collect stats inputs
      if (funNum != null) {
        funSelfValues.push(funNum);
        if (winnerNum === 1) funSelfWins.push(funNum);
        else funSelfLosses.push(funNum);
      }

      const others = [p2Num, p3Num, p4Num].filter(
        (n): n is number => n != null
      );
      if (others.length > 0) {
        const avgOthers =
          others.reduce((a, b) => a + b, 0) / others.length;
        funOthersValues.push(avgOthers);
      }

      if (estNum != null) {
        estBracketValues.push(estNum);
      }

      deckGames.push({
        deck: deckName,
        winner: winnerNum,
        fun: funNum,
        p2Fun: p2Num,
        p3Fun: p3Num,
        p4Fun: p4Num,
        notes: notesVal,
        estBracket: estNum
      });

      const playersInGame = 1 + ((p2Num != null) ? 1 : 0) + ((p3Num != null) ? 1 : 0) + ((p4Num != null) ? 1 : 0);

      playersPlayed += playersInGame;
    }

    expectedWinrate = 1 / playersPlayed * totalGames * 100;

  }

  const losses = Math.max(totalGames - wins, 0);
  const winRate =
    totalGames > 0 ? (wins / totalGames) * 100 : 0;

  const mean = (xs: number[]): number | null =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;

  const stdDev = (xs: number[]): number | null => {
    if (xs.length < 2) return null;
    const m = mean(xs)!;
    const variance =
      xs.reduce((sum, x) => sum + (x - m) ** 2, 0) / xs.length; // population std; change to /(xs.length - 1) for sample
    return Math.sqrt(variance);
  };

  const avgFunSelf = mean(funSelfValues);
  const stdFunSelf = stdDev(funSelfValues);
  const avgFunOthers = mean(funOthersValues);
  const avgFunWins = mean(funSelfWins);
  const avgFunLosses = mean(funSelfLosses);
  const avgEstBracket = mean(estBracketValues);

  return {
    deckName,
    spreadsheetId,
    deckMeta,
    stats: {
      totalGames,
      wins,
      losses,
      winRate,
      expectedWinrate,
      avgFunSelf,
      stdFunSelf,
      avgFunOthers,
      avgFunWins,
      avgFunLosses,
      avgEstBracket
    },
    games: deckGames
  };
};
