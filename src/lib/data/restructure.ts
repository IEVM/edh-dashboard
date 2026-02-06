/**
 * Domain model for a single deck.
 *
 * - `targetBracket` is your expected power level / bracket for the deck.
 * - `summary` is a free-text description.
 * - `archidektLink` can link to the decklist.
 * - `stats` and `games` are optional, so a deck can exist without them.
 */
export type Deck = {
  deckName: string;
  targetBracket: number | null;
  summary: string | null;
  archidektLink: string | null;
  stats?: Stats;
  games?: Games;
};

/**
 * Aggregated statistics for a deck or for the whole account.
 *
 * All average values are nullable to allow "no data yet".
 */
export type Stats = {
  totalGames: number;
  wins: number;
  losses: number;
  /** Observed win rate in 0..1 (wins / totalGames). */
  winRate: number;
  /** Expected win rate (e.g. based on power level or a model). */
  expectedWinrate: number;
  avgFunSelf: number | null;
  stdFunSelf: number | null;
  avgFunOthers: number | null;
  avgFunWins: number | null;
  avgFunLosses: number | null;
  avgEstBracket: number | null;
};

/**
 * Raw game entries as they come out of the spreadsheet (after basic mapping).
 *
 * `deck` can either be the deck name (string) or a fully resolved Deck object,
 * depending on how far the processing pipeline has gone.
 */
export type Games = Array<{
  deck: string | Deck;
  winner: number | null;
  fun: number | null;
  p2Fun: number | null;
  p3Fun: number | null;
  p4Fun: number | null;
  notes: string | null;
  estBracket: number | null;
}>;

/**
 * Simple filter definition used to slice spreadsheet data.
 *
 * `column` is matched against normalized column headers (lowercase, trimmed).
 * `match` is compared with the raw cell value using `==` (not strict).
 */
type Filter = Array<{
  column: string;
  match: string;
}>;

/** Convert a spreadsheet cell value into a number or null if empty/invalid. */
function toNumberOrNull(value: any): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

/** @returns The average value, or null if the list is empty. */
function average(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/** @returns The sample standard deviation, or null if fewer than 2 values exist. */
function standardDeviation(values: number[]): number | null {
  if (values.length < 2) return null;
  const avg = average(values)!;
  const variance =
    values.reduce((acc, v) => acc + (v - avg) * (v - avg), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Load one or more logical "databases" (sheets) from a Google Spreadsheet.
 *
 * Each entry in `database` corresponds to a sheet name that this function
 * knows how to read. Currently supported:
 *   - "Games" → range 'Games!A1:H'
 *   - "Decks" → range 'Decks!A1:D'
 *
 * @param spreadsheetId ID of the Google Spreadsheet (per-user "database").
 * @param sheetsClient  Pre-configured Google Sheets API client.
 * @param database      List of logical databases (sheet names) to load.
 *                      Defaults to ["Games"].
 * @returns             An array of 2D arrays (`values`) in the same order as `database`.
 */
export async function loadDatabase(
  spreadsheetId: string,
  sheetsClient: any,
  database: string[] = ['Games']
): Promise<any[][][]> {
  const requests: Array<Promise<any>> = [];

  for (const db of database) {
    switch (db) {
      case 'Games': {
        const gamesReq = sheetsClient.spreadsheets.values.get({
          spreadsheetId: spreadsheetId as string,
          range: 'Games!A1:H'
        });

        requests.push(gamesReq);
        break;
      }
      case 'Decks': {
        const deckReq = sheetsClient.spreadsheets.values.get({
          spreadsheetId: spreadsheetId as string,
          range: 'Decks!A1:D'
        });

        requests.push(deckReq);
        break;
      }
      default:
        // Defensive log: this function was called with an unknown sheet name.
        console.warn('A non existent sheet was requested.');
    }
  }

  const responses = await Promise.all(requests);

  // If a sheet is completely empty, default to an empty array.
  return responses.map((res) => res.data.values ?? []);
}

/**
 * Filter a 2D spreadsheet data array by a list of column/match predicates.
 *
 * Notes:
 * - This function *does not* explicitly strip the header row; it filters the whole array.
 *   In practice, the header often gets removed because it doesn't match the filter values.
 * - Filters are applied sequentially (AND semantics).
 *
 * @param spreadsheetData 2D array of cell values, including a header row at index 0.
 * @param filter          List of column filters to apply.
 * @returns               The filtered 2D array (may still include the header row in edge cases).
 */
export function filterData(spreadsheetData: any, filter: Filter) {
  const headers = spreadsheetData[0].map((h: any) => String(h ?? '').toLowerCase().trim());

  for (const f of filter) {
    const idx = headers.indexOf(f.column);

    // If the column is not found, this filter silently does nothing.
    if (idx === -1) continue;

    spreadsheetData = spreadsheetData.filter((row: any) => row[idx] == f.match);
  }

  return spreadsheetData;
}

/**
 * Convert raw deck spreadsheet data into a typed Deck object.
 *
 * Expected input:
 * - 2D array with headers in row 0 and one or more deck rows below.
 * - Typically, you filter to a single deck before calling this.
 */
export function getDeckJson(spreadsheetData: any): Deck {
  if (!Array.isArray(spreadsheetData) || spreadsheetData.length < 2) {
    return {
      deckName: '',
      targetBracket: null,
      summary: null,
      archidektLink: null
    };
  }

  const [headerRow, ...rows] = spreadsheetData;
  const headers = headerRow.map((h: any) => String(h ?? '').toLowerCase().trim());

  const idxName = headers.indexOf('name');
  const idxTarget = headers.indexOf('target bracket');
  const idxSummary = headers.indexOf('summary');
  const idxArchidekt = headers.indexOf('archidekt link');

  const row = rows[0] ?? [];

  return {
    deckName: idxName === -1 ? '' : (row[idxName] ?? ''),
    targetBracket: idxTarget === -1 ? null : toNumberOrNull(row[idxTarget]),
    summary: idxSummary === -1 ? null : (row[idxSummary] ?? null),
    archidektLink: idxArchidekt === -1 ? null : (row[idxArchidekt] ?? null)
  };
}

/**
 * Convert raw "Games" sheet data (2D array) into a typed Games array.
 *
 * Expected headers (normalized to lowercase):
 * deck | winner | fun | p2 fun | p3 fun | p4 fun | notes | est. pod bracket
 */
export function getGamesJson(spreadsheetData: any): Games {
  if (!Array.isArray(spreadsheetData) || spreadsheetData.length < 2) {
    return [];
  }

  const [headerRow, ...rows] = spreadsheetData;
  const headers = headerRow.map((h: any) => String(h ?? '').toLowerCase().trim());

  const idxDeck = headers.indexOf('deck');
  const idxWinner = headers.indexOf('winner');
  const idxFun = headers.indexOf('fun');
  const idxP2Fun = headers.indexOf('p2 fun');
  const idxP3Fun = headers.indexOf('p3 fun');
  const idxP4Fun = headers.indexOf('p4 fun');
  const idxNotes = headers.indexOf('notes');
  const idxEstBracket = headers.indexOf('est. pod bracket');

  // Local helper (duplicates the global one); keeping as-is for now.
  const toNumberOrNull = (value: any): number | null => {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  };

  return rows
    .filter(
      (row: any) =>
        Array.isArray(row) && row.some((cell) => cell !== undefined && cell !== null && cell !== '')
    )
    .map((row: any) => {
      const winner = idxWinner === -1 ? null : toNumberOrNull(row[idxWinner]);
      const fun = idxFun === -1 ? null : toNumberOrNull(row[idxFun]);
      const p2Fun = idxP2Fun === -1 ? null : toNumberOrNull(row[idxP2Fun]);
      const p3Fun = idxP3Fun === -1 ? null : toNumberOrNull(row[idxP3Fun]);
      const p4Fun = idxP4Fun === -1 ? null : toNumberOrNull(row[idxP4Fun]);
      const estBracket = idxEstBracket === -1 ? null : toNumberOrNull(row[idxEstBracket]);

      return {
        deck: idxDeck === -1 ? '' : (row[idxDeck] ?? ''),
        winner,
        fun,
        p2Fun,
        p3Fun,
        p4Fun,
        notes: idxNotes === -1 ? null : (row[idxNotes] ?? null),
        estBracket
      } as Games[number];
    });
}

/**
 * Compute a Stats struct from a list of games.
 *
 * Assumes:
 * - winner === 1 means "win"
 * - winner === 2, 3, 4 means "loss"
 * Other values are treated as "unknown/ignored".
 */
export function statsFromGames(games: Games): Stats {
  const totalGames = games.length;
  let wins = 0;
  let losses = 0;

  const funSelfValues: number[] = [];
  const funOtherValues: number[] = [];
  const funWinsValues: number[] = [];
  const funLossValues: number[] = [];
  const estBracketValues: number[] = [];
  let expectedWins = 0;

  for (const g of games) {
    if (g.winner === 1) wins++;
    else if (g.winner && g.winner >= 2 && g.winner <= 4) losses++;

    if (g.fun !== null) {
      funSelfValues.push(g.fun);

      if (g.winner === 1) funWinsValues.push(g.fun);
      else if (g.winner === 0) funLossValues.push(g.fun);
    }

    if (g.p2Fun !== null) funOtherValues.push(g.p2Fun);
    if (g.p3Fun !== null) funOtherValues.push(g.p3Fun);
    if (g.p4Fun !== null) funOtherValues.push(g.p4Fun);

    if (g.estBracket !== null) estBracketValues.push(g.estBracket);

    // Infer table size from which fun columns were filled in.
    let players = 1;
    if (g.p2Fun !== null) players += 1;
    if (g.p3Fun !== null) players += 1;
    if (g.p4Fun !== null) players += 1;
    expectedWins += 1 / players;
  }

  const winRate = totalGames ? wins / totalGames : 0;
  const expectedWinrate = totalGames ? expectedWins / totalGames : 0;

  return {
    totalGames,
    wins,
    losses,
    winRate,
    expectedWinrate,
    avgFunSelf: average(funSelfValues),
    stdFunSelf: standardDeviation(funSelfValues),
    avgFunOthers: average(funOtherValues),
    avgFunWins: average(funWinsValues),
    avgFunLosses: average(funLossValues),
    avgEstBracket: average(estBracketValues)
  };
}

/**
 * Return a copy of the deck where `stats` is derived from `games` if missing.
 */
export function withStatsFromGames(deck: Deck): Deck {
  if (!deck.games || deck.games.length === 0 || deck.stats) {
    return deck;
  }

  return { ...deck, stats: statsFromGames(deck.games) };
}

/**
 * Attach correctly filtered games (from raw sheet data) to a deck.
 *
 */
export function withGames(deck: Deck, gamesSheetData: any): Deck {
  const filter: Filter = [{ column: 'deck', match: deck.deckName }];

  const filteredRowsMaybeIncludingHeader = filterData(gamesSheetData, filter);

  // Reattach the original header row so getGamesJson can parse correctly.
  const headerRow = gamesSheetData[0];
  const filteredWithHeader = [headerRow, ...filteredRowsMaybeIncludingHeader];

  // Parse into typed Games and ensure each game references this Deck instance.
  const games = getGamesJson(filteredWithHeader).map((g) => ({ ...g, deck }));

  return { ...deck, games };
}
