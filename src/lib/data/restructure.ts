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
    /** Total number of recorded games. */
    totalGames: number;
    /** Number of wins across all recorded games. */
    wins: number;
    /** Number of losses across all recorded games. */
    losses: number;
    /** Observed win rate in 0..1 (wins / totalGames). */
    winRate: number;
    /** Expected win rate (e.g. based on power level or a model). */
    expectedWinrate: number;
    /** Average fun score for yourself. */
    avgFunSelf: number | null;
    /** Standard deviation of fun score for yourself. */
    stdFunSelf: number | null;
    /** Average fun score for other players (p2/p3/p4 combined). */
    avgFunOthers: number | null;
    /** Average fun score in games you won. */
    avgFunWins: number | null;
    /** Average fun score in games you lost. */
    avgFunLosses: number | null;
    /** Average estimated bracket across all games. */
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

/**
 * Convert a spreadsheet cell value into a number or null if empty/invalid.
 */
function toNumberOrNull(value: any): number | null {
    if (value === undefined || value === null || value === '') return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
}

/**
 * Compute the arithmetic mean of a list of numbers.
 *
 * @returns The average value, or null if the list is empty.
 */
function average(values: number[]): number | null {
    if (!values.length) return null;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return sum / values.length;
}

/**
 * Compute the sample standard deviation of a list of numbers.
 *
 * @returns The standard deviation, or null if fewer than 2 values exist.
 */
function standardDeviation(values: number[]): number | null {
    if (values.length < 2) return null;
    const avg = average(values)!;
    const variance =
        values.reduce((acc, v) => acc + (v - avg) * (v - avg), 0) /
        (values.length - 1);
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
 *                      Defaults to ["Games"]; the other options are
 *                      ["Decks"] or ["Games", "Decks"].
 * @returns             An array of 2D arrays (`values`) in the same order as `database`.
 */
export async function loadDatabase(
    spreadsheetId: string,
    sheetsClient: any,
    database: string[] = ['Games']
) {
    const requests = [];

    for (const db of database) {
        switch (db) {
            case 'Games': {
                // Load all columns A..H from the "Games" sheet including header row.
                const gamesReq = sheetsClient.spreadsheets.values.get({
                    spreadsheetId: spreadsheetId as string,
                    range: 'Games!A1:H'
                });

                requests.push(gamesReq);
                break;
            }
            case 'Decks': {
                // Load basic deck metadata from the "Decks" sheet.
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

    // Run all sheet reads in parallel.
    const responses = await Promise.all(requests);

    // Extract raw cell values from each response.
    // If a sheet is completely empty, default to an empty array.
    const data = responses.map((res) => res.data.values ?? []);

    return data;
}

/**
 * Filter a 2D spreadsheet data array by a list of column/match predicates.
 *
 * - Assumes the first row contains headers.
 * - Headers are normalized to lowercase and trimmed before matching.
 * - Filters are applied sequentially (AND semantics).
 * - The header row itself is removed by the filtering (the result is data rows only).
 *
 * @param spreadsheetData 2D array of cell values, including a header row at index 0.
 * @param filter          List of column filters to apply.
 * @returns               The filtered 2D array, WITHOUT the header row.
 */
export function filterData(spreadsheetData: any, filter: Filter) {
    const headers = spreadsheetData[0].map((h: any) =>
        String(h ?? '').toLowerCase().trim()
    );

    for (const f of filter) {
        const idx = headers.indexOf(f.column);

        // If the column is not found, this filter silently does nothing.
        // (You might want to log or throw here in the future.)
        if (idx === -1) continue;

        spreadsheetData = spreadsheetData.filter(
            (row: any) => row[idx] == f.match
        );
    }

    return spreadsheetData;
}

/**
 * Convert raw deck spreadsheet data into a typed Deck object.
 *
 * Expected input:
 *   - 2D array with headers in row 0 and one or more deck rows below.
 * Typically, you filter to a single deck before calling this, so the first data
 * row corresponds to that deck.
 */
export function getDeckJson(spreadsheetData: any): Deck {
    // Expect: 2D array with header row as first entry.
    if (!Array.isArray(spreadsheetData) || spreadsheetData.length < 2) {
        // Fallback empty deck if the sheet is empty or malformed.
        return {
            deckName: '',
            targetBracket: null,
            summary: null,
            archidektLink: null
        };
    }

    const [headerRow, ...rows] = spreadsheetData;
    const headers = headerRow.map((h: any) =>
        String(h ?? '').toLowerCase().trim()
    );

    const idxName = headers.indexOf('name');
    const idxTarget = headers.indexOf('target bracket');
    const idxSummary = headers.indexOf('summary');
    const idxArchidekt = headers.indexOf('archidekt link');

    // For now: take the first data row.
    // If you filter by deck before calling this, that will be the specific deck.
    const row = rows[0] ?? [];

    const deck: Deck = {
        deckName: idxName === -1 ? '' : (row[idxName] ?? ''),
        targetBracket:
            idxTarget === -1 ? null : toNumberOrNull(row[idxTarget]),
        summary: idxSummary === -1 ? null : (row[idxSummary] ?? null),
        archidektLink:
            idxArchidekt === -1 ? null : (row[idxArchidekt] ?? null)
    };

    return deck;
}

/**
 * Convert raw "Games" sheet data (2D array) into a typed Games array.
 *
 * Expected input:
 *   - 2D array with headers in row 0 and one or more game rows below.
 *   - Column headers are expected to include:
 *       deck | winner | fun | p2Fun | p3Fun | p4Fun | notes | estBracket
 */
export function getGamesJson(spreadsheetData: any): Games {
    if (!Array.isArray(spreadsheetData) || spreadsheetData.length < 2) {
        return [];
    }

    const [headerRow, ...rows] = spreadsheetData;
    const headers = headerRow.map((h: any) =>
        String(h ?? '').toLowerCase().trim()
    );

    const idxDeck = headers.indexOf('deck');
    const idxWinner = headers.indexOf('winner');
    const idxFun = headers.indexOf('fun');
    const idxP2Fun = headers.indexOf('p2 fun');
    const idxP3Fun = headers.indexOf('p3 fun');
    const idxP4Fun = headers.indexOf('p4 fun');
    const idxNotes = headers.indexOf('notes');
    const idxEstBracket = headers.indexOf('est. pod bracket');

    // Local helper to convert to number/null; mirrors the global toNumberOrNull.
    const toNumberOrNull = (value: any): number | null => {
        if (value === undefined || value === null || value === '') return null;
        const n = Number(value);
        return Number.isNaN(n) ? null : n;
    };

    const games: Games = rows
        // Skip rows that are completely empty.
        .filter(
            (row: any) =>
                Array.isArray(row) &&
                row.some(
                    (cell) =>
                        cell !== undefined && cell !== null && cell !== ''
                )
        )
        .map((row: any) => {
            const winner =
                idxWinner === -1 ? null : toNumberOrNull(row[idxWinner]);
            const fun =
                idxFun === -1 ? null : toNumberOrNull(row[idxFun]);
            const p2Fun =
                idxP2Fun === -1 ? null : toNumberOrNull(row[idxP2Fun]);
            const p3Fun =
                idxP3Fun === -1 ? null : toNumberOrNull(row[idxP3Fun]);
            const p4Fun =
                idxP4Fun === -1 ? null : toNumberOrNull(row[idxP4Fun]);
            const estBracket =
                idxEstBracket === -1 ? null : toNumberOrNull(row[idxEstBracket]);

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

    return games;
}

/**
 * Compute a Stats struct from a list of games.
 *
 * This works even if there is no specific deck object,
 * e.g. for global stats or filtered subsets.
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

    for (const g of games) {
        // Wins / losses
        if (g.winner === 1) wins++;
        else if (g.winner === 0) losses++;

        // Fun for self
        if (g.fun !== null) {
            funSelfValues.push(g.fun);

            if (g.winner === 1) {
                funWinsValues.push(g.fun);
            } else if (g.winner === 0) {
                funLossValues.push(g.fun);
            }
        }

        // Fun for others
        if (g.p2Fun !== null) funOtherValues.push(g.p2Fun);
        if (g.p3Fun !== null) funOtherValues.push(g.p3Fun);
        if (g.p4Fun !== null) funOtherValues.push(g.p4Fun);

        // Estimated bracket
        if (g.estBracket !== null) estBracketValues.push(g.estBracket);
    }

    const winRate = totalGames ? wins / totalGames : 0;

    const stats: Stats = {
        totalGames,
        wins,
        losses,
        winRate,
        // Placeholder expected winrate for now; adjust later if you have a model.
        expectedWinrate: 0.5,
        avgFunSelf: average(funSelfValues),
        stdFunSelf: standardDeviation(funSelfValues),
        avgFunOthers: average(funOtherValues),
        avgFunWins: average(funWinsValues),
        avgFunLosses: average(funLossValues),
        avgEstBracket: average(estBracketValues)
    };

    return stats;
}

/**
 * Return a copy of the deck where `stats` is derived from `games` if missing.
 *
 * - If `deck.stats` already exists, the deck is returned unchanged.
 * - If there are no games, the deck is returned unchanged.
 * - Otherwise, stats are computed from `deck.games` via `statsFromGames`.
 */
export function withStatsFromGames(deck: Deck): Deck {
    if (!deck.games || deck.games.length === 0 || deck.stats) {
        return deck;
    }

    const stats = statsFromGames(deck.games);
    return { ...deck, stats };
}

/**
 * Attach correctly filtered games (from raw sheet data) to a deck.
 *
 * - Uses `filterData` with a filter on the "deck" column = deck.deckName.
 * - Restores the header row (since `filterData` removes it).
 * - Parses the filtered data via `getGamesJson`.
 * - Normalises each game's `deck` field to reference the `deck` object.
 *
 * @param deck           Deck to attach games to.
 * @param gamesSheetData Raw "Games" sheet data (2D array including header row).
 * @returns              A new Deck instance with `games` set to the filtered list.
 */
export function withGames(deck: Deck, gamesSheetData: any): Deck {
    // Build a filter that keeps only rows for this deck name.
    const filter: Filter = [
        {
            column: 'deck',      // matches the normalized header "deck"
            match: deck.deckName // must match the cell contents in the sheet
        }
    ];

    // Filter rows for this deck; filterData removes the header row.
    const filteredRowsOnly = filterData(gamesSheetData, filter);

    // Reattach the original header row so getGamesJson can parse correctly.
    const headerRow = gamesSheetData[0];
    const filteredWithHeader = [headerRow, ...filteredRowsOnly];

    // Parse into typed Games and ensure each game references this Deck instance.
    const games = getGamesJson(filteredWithHeader).map((g) => ({...g, deck}));

    return {...deck, games};
}
