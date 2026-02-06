import { describe, expect, it } from 'vitest';
import {
  filterData,
  getDeckJson,
  getGamesJson,
  statsFromGames,
  withGames,
  withStatsFromGames,
  type Deck,
  type Games
} from '$lib/data/restructure';

describe('filterData', () => {
  it('filters rows by column match (header is removed when it does not match)', () => {
    const data = [
      ['Deck', 'Winner'],
      ['A', 1],
      ['B', 2],
      ['A', 3]
    ];

    const result = filterData(data, [{ column: 'deck', match: 'A' }]);

    expect(result).toEqual([
      ['A', 1],
      ['A', 3]
    ]);
  });

  it('returns original data when column is missing', () => {
    const data = [
      ['Deck', 'Winner'],
      ['A', 1]
    ];

    const result = filterData(data, [{ column: 'unknown', match: 'A' }]);

    expect(result).toEqual(data);
  });
});

describe('getDeckJson', () => {
  it('returns empty deck for missing or invalid input', () => {
    const deck = getDeckJson([]);

    expect(deck).toEqual({
      deckName: '',
      targetBracket: null,
      summary: null,
      archidektLink: null
    });
  });

  it('maps a deck row into a typed deck object', () => {
    const data = [
      ['Name', 'Target Bracket', 'Summary', 'Archidekt Link'],
      ['Grixis Party', '3', 'Fun value engine', 'https://archidekt.com/decks/1']
    ];

    const deck = getDeckJson(data);

    expect(deck).toEqual({
      deckName: 'Grixis Party',
      targetBracket: 3,
      summary: 'Fun value engine',
      archidektLink: 'https://archidekt.com/decks/1'
    });
  });
});

describe('getGamesJson', () => {
  it('maps rows into typed games and drops empty rows', () => {
    const data = [
      ['Deck', 'Winner', 'Fun', 'P2 Fun', 'P3 Fun', 'P4 Fun', 'Notes', 'Est. Pod Bracket'],
      ['A', '1', '7', '6', '', '5', 'solid', '3'],
      ['', '', '', '', '', '', '', ''],
      ['B', 2, null, 4, 4, 4, null, '2']
    ];

    const games = getGamesJson(data);

    expect(games).toHaveLength(2);
    expect(games[0]).toMatchObject({
      deck: 'A',
      winner: 1,
      fun: 7,
      p2Fun: 6,
      p3Fun: null,
      p4Fun: 5,
      notes: 'solid',
      estBracket: 3
    });
  });
});

describe('statsFromGames', () => {
  it('computes aggregate stats for wins, losses, and averages', () => {
    const games: Games = [
      {
        deck: 'A',
        winner: 1,
        fun: 8,
        p2Fun: 7,
        p3Fun: null,
        p4Fun: null,
        notes: null,
        estBracket: 3
      },
      {
        deck: 'A',
        winner: 2,
        fun: 4,
        p2Fun: 5,
        p3Fun: 5,
        p4Fun: 5,
        notes: null,
        estBracket: 2
      }
    ];

    const stats = statsFromGames(games);

    expect(stats.totalGames).toBe(2);
    expect(stats.wins).toBe(1);
    expect(stats.losses).toBe(1);
    expect(stats.winRate).toBeCloseTo(0.5);
    expect(stats.avgFunSelf).toBe(6);
    expect(stats.stdFunSelf).toBeCloseTo(2.8284, 3);
    expect(stats.avgFunOthers).toBe(5.5);
    expect(stats.avgFunWins).toBe(8);
    expect(stats.avgFunLosses).toBeNull();
    expect(stats.avgEstBracket).toBe(2.5);
    expect(stats.expectedWinrate).toBeCloseTo(0.375);
  });

  it('computes expected win rate from inferred table size', () => {
    const games: Games = [
      {
        deck: 'A',
        winner: 1,
        fun: 5,
        p2Fun: 4,
        p3Fun: 3,
        p4Fun: 2,
        notes: null,
        estBracket: null
      },
      {
        deck: 'A',
        winner: 2,
        fun: 4,
        p2Fun: 3,
        p3Fun: null,
        p4Fun: null,
        notes: null,
        estBracket: null
      },
      {
        deck: 'A',
        winner: 1,
        fun: 3,
        p2Fun: null,
        p3Fun: null,
        p4Fun: null,
        notes: null,
        estBracket: null
      }
    ];

    const stats = statsFromGames(games);

    // Expected wins = 1/4 + 1/2 + 1/1 = 1.75 across 3 games
    expect(stats.expectedWinrate).toBeCloseTo(1.75 / 3, 5);
  });
});

describe('withStatsFromGames', () => {
  it('adds stats when missing', () => {
    const games: Games = [
      {
        deck: 'A',
        winner: 1,
        fun: 6,
        p2Fun: null,
        p3Fun: null,
        p4Fun: null,
        notes: null,
        estBracket: null
      }
    ];

    const deck: Deck = {
      deckName: 'A',
      targetBracket: null,
      summary: null,
      archidektLink: null,
      games
    };

    const updated = withStatsFromGames(deck);

    expect(updated.stats).toBeDefined();
    expect(updated.stats?.wins).toBe(1);
  });

  it('returns the same object if stats already exist', () => {
    const deck: Deck = {
      deckName: 'A',
      targetBracket: null,
      summary: null,
      archidektLink: null,
      stats: {
        totalGames: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        expectedWinrate: 0.25,
        avgFunSelf: null,
        stdFunSelf: null,
        avgFunOthers: null,
        avgFunWins: null,
        avgFunLosses: null,
        avgEstBracket: null
      }
    };

    const updated = withStatsFromGames(deck);

    expect(updated).toBe(deck);
  });
});

describe('withGames', () => {
  it('attaches filtered games and preserves deck reference in each game', () => {
    const deck: Deck = {
      deckName: 'A',
      targetBracket: null,
      summary: null,
      archidektLink: null
    };

    const gamesSheetData = [
      ['Deck', 'Winner', 'Fun', 'P2 Fun', 'P3 Fun', 'P4 Fun', 'Notes', 'Est. Pod Bracket'],
      ['A', 1, 7, 6, 6, 6, 'nice', 3],
      ['B', 2, 4, 4, 4, 4, 'meh', 2],
      ['A', 2, 5, '', '', '', null, 4]
    ];

    const updated = withGames(deck, gamesSheetData);

    expect(updated.games).toHaveLength(2);
    expect(updated.games?.[0].deck).toBe(deck);
  });
});
