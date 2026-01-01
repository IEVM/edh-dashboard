// src/routes/api/sheets/create-sample/+server.ts
import type { RequestHandler } from './$types';
import { getSheetsClient, getTokens } from '$lib/server/google';

// Sample decks to pre-fill the "Decks" sheet.
const SAMPLE_DECKS = [
  [
    'Zimone Landfall',
    3,
    'Generic simic landfall deck that cheats out big threats early via Zimone.',
    'https://archidekt.com/decks/10802991/zimone_mystery_unraveler'
  ],
  [
    'Alesha Soft Stax',
    3,
    'Mardu Flicker with reanimation endgame.',
    'https://archidekt.com/decks/6585497/alesha'
  ],
  [
    'Mono Black Control',
    4,
    'A mono black sacrifice creature control deck.',
    'https://archidekt.com/decks/7097897/kalitas'
  ],
  [
    'Mono Blue Aragorn',
    3,
    'Mono blue Aragorn spellslinger deck.',
    'https://archidekt.com/decks/10817644/mono_blue_aragorn'
  ],
  [
    'Guff Superfriends',
    2,
    "A superfriends deck that doesn't overload on Boardwipes.",
    '-' // no link
  ],
  [
    'Havi Pod',
    3,
    'Havi pod deck that has few repeatable sac outlets and infinite combos.',
    'https://archidekt.com/decks/14300482/havi_pod'
  ],
  ['Tannuk Budget', 2, 'Tannuk deck for 25 Euro.', 'https://archidekt.com/decks/15136922/tannuk'],
  ['Sproofus Aggro', 4, 'An agressive mono green deck.', 'https://archidekt.com/decks/14612865/shroofus'],
  ['Zada', 3, 'Just another Zada list.', 'https://archidekt.com/decks/2572012/zada'],
  ['Lukas Slimes', 2, 'The Lukas Slime deck.', 'https://archidekt.com/decks/11223185/lukas_slimes'],
  [
    'Jumpstart Piles',
    2,
    'A collection of 5 Jumpstart decks to be mixed.',
    'https://archidekt.com/decks/16180870/jumpstart_combined'
  ]
];

/**
 * @returns Random integer in the inclusive range [min, max].
 */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Creates a demo spreadsheet:
 *  - "Decks" sheet pre-filled with SAMPLE_DECKS
 *  - "Games" sheet pre-filled with 5000 random games (for analytics/testing)
 *  - Data validation rules for brackets, winner, fun ratings, etc.
 */
export const POST: RequestHandler = async ({ locals }) => {
  const tokens = getTokens(locals.sessionId);
  if (!tokens) return new Response('Not authenticated', { status: 401 });

  const sheets = getSheetsClient(locals.sessionId);

  // 1) Create spreadsheet with Decks + Games
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'EDH Demo Database (with sample decks)' },
      sheets: [{ properties: { title: 'Decks' } }, { properties: { title: 'Games' } }]
    }
  });

  const spreadsheetId = createRes.data.spreadsheetId;
  if (!spreadsheetId) {
    return new Response('Failed to create spreadsheet', { status: 500 });
  }

  // Grab sheetIds for validation ranges.
  const decksSheet = createRes.data.sheets?.find((s) => s.properties?.title === 'Decks');
  const gamesSheet = createRes.data.sheets?.find((s) => s.properties?.title === 'Games');

  const decksSheetId = decksSheet?.properties?.sheetId;
  const gamesSheetId = gamesSheet?.properties?.sheetId;

  if (decksSheetId == null || gamesSheetId == null) {
    return new Response('Missing sheet IDs', { status: 500 });
  }

  // 2) Write headers + sample decks
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: 'RAW',
      data: [
        {
          range: 'Decks!A1:D1',
          values: [['Name', 'Target Bracket', 'Summary', 'Archidekt Link']]
        },
        {
          range: `Decks!A2:D${SAMPLE_DECKS.length + 1}`,
          values: SAMPLE_DECKS
        },
        {
          range: 'Games!A1:H1',
          values: [['Deck', 'Winner', 'Fun', 'P2 Fun', 'P3 Fun', 'P4 Fun', 'Notes', 'Est. Pod Bracket']]
        }
      ]
    }
  });

  // 3) Add validation rules (same as your template)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Decks!B2:B1000 -> number between 1 and 5
        {
          setDataValidation: {
            range: {
              sheetId: decksSheetId,
              startRowIndex: 1,
              endRowIndex: 1000,
              startColumnIndex: 1, // B
              endColumnIndex: 2
            },
            rule: {
              condition: {
                type: 'NUMBER_BETWEEN',
                values: [{ userEnteredValue: '1' }, { userEnteredValue: '5' }]
              },
              strict: true,
              showCustomUi: true
            }
          }
        },

        // Games!A2:A5000 -> dropdown from Decks!A2:A
        {
          setDataValidation: {
            range: {
              sheetId: gamesSheetId,
              startRowIndex: 1,
              endRowIndex: 5000,
              startColumnIndex: 0, // A
              endColumnIndex: 1
            },
            rule: {
              condition: {
                type: 'ONE_OF_RANGE',
                values: [{ userEnteredValue: '=Decks!A2:A' }]
              },
              strict: true,
              showCustomUi: true
            }
          }
        },

        // Games!B2:B5000 -> winner 1-4 (player seat)
        {
          setDataValidation: {
            range: {
              sheetId: gamesSheetId,
              startRowIndex: 1,
              endRowIndex: 5000,
              startColumnIndex: 1, // B
              endColumnIndex: 2
            },
            rule: {
              condition: {
                type: 'NUMBER_BETWEEN',
                values: [{ userEnteredValue: '1' }, { userEnteredValue: '4' }]
              },
              strict: true,
              showCustomUi: true
            }
          }
        },

        // Games!C2:F5000 -> Fun columns 1-5
        {
          setDataValidation: {
            range: {
              sheetId: gamesSheetId,
              startRowIndex: 1,
              endRowIndex: 5000,
              startColumnIndex: 2, // C
              endColumnIndex: 6 // F (exclusive)
            },
            rule: {
              condition: {
                type: 'NUMBER_BETWEEN',
                values: [{ userEnteredValue: '1' }, { userEnteredValue: '5' }]
              },
              strict: true,
              showCustomUi: true
            }
          }
        },

        // Games!H2:H5000 -> Est. Pod Bracket 1-5
        {
          setDataValidation: {
            range: {
              sheetId: gamesSheetId,
              startRowIndex: 1,
              endRowIndex: 5000,
              startColumnIndex: 7, // H
              endColumnIndex: 8
            },
            rule: {
              condition: {
                type: 'NUMBER_BETWEEN',
                values: [{ userEnteredValue: '1' }, { userEnteredValue: '5' }]
              },
              strict: true,
              showCustomUi: true
            }
          }
        }
      ]
    }
  });

  // 4) Generate 5000 random games
  const deckNames = SAMPLE_DECKS.map((d) => d[0] as string);
  const games: (string | number)[][] = [];

  for (let i = 0; i < 5000; i++) {
    const deckIndex = randInt(0, deckNames.length - 1);
    const deckName = deckNames[deckIndex];

    const winner = randInt(1, 4); // player 1–4
    const fun = randInt(1, 5);
    const p2Fun = randInt(1, 5);
    const p3Fun = randInt(1, 5);
    const p4Fun = randInt(1, 5);

    // Est. pod bracket loosely based on target bracket ±1
    const targetBracket = SAMPLE_DECKS[deckIndex][1] as number;
    const estBracketRaw = targetBracket + randInt(-1, 1);
    const estBracket = Math.min(5, Math.max(1, estBracketRaw));

    const note = i % 10 === 0 ? 'Testing game for analytics' : '';

    games.push([deckName, winner, fun, p2Fun, p3Fun, p4Fun, note, estBracket]);
  }

  // Write games starting at A2 (5000 rows => A2..A5001)
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Games!A2:H5001',
    valueInputOption: 'RAW',
    requestBody: { values: games }
  });

  return new Response(
    JSON.stringify({
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
