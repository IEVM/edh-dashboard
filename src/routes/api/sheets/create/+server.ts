import type { RequestHandler } from './$types';
import { getSheetsClient, getTokens } from '$lib/server/google';

/**
 * Creates a new Google Spreadsheet configured as an "EDH Deck Database".
 *
 * Steps:
 *  1) Create a spreadsheet with two sheets: "Decks" and "Games"
 *  2) Write header rows for both sheets
 *  3) Add data validation rules (bracket ranges, fun scores, etc.)
 *
 * Responds with `{ spreadsheetId, url }` on success, or a 401/500 response otherwise.
 */
export const POST: RequestHandler = async ({ locals }) => {
  const tokens = await getTokens(locals.sessionId);
  if (!tokens) return new Response('Not authenticated', { status: 401 });

  const sheets = await getSheetsClient(locals.sessionId);

  // 1) Create spreadsheet with Decks + Games sheets
  const createRes = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'EDH Deck Database'
      },
      sheets: [
        { properties: { title: 'Decks' } },
        { properties: { title: 'Games' } }
      ]
    }
  });

  const spreadsheetId = createRes.data.spreadsheetId;
  if (!spreadsheetId) {
    return new Response('Failed to create spreadsheet', { status: 500 });
  }

  // Get sheetIds for Decks and Games (needed for validation ranges below).
  const decksSheet = createRes.data.sheets?.find((s) => s.properties?.title === 'Decks');
  const gamesSheet = createRes.data.sheets?.find((s) => s.properties?.title === 'Games');

  const decksSheetId = decksSheet?.properties?.sheetId;
  const gamesSheetId = gamesSheet?.properties?.sheetId;

  if (decksSheetId == null || gamesSheetId == null) {
    return new Response('Missing sheet IDs', { status: 500 });
  }

  // 2) Write header rows with values.batchUpdate
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
          range: 'Games!A1:H1',
          values: [['Deck', 'Winner', 'Fun', 'P2 Fun', 'P3 Fun', 'P4 Fun', 'Notes', 'Est. Pod Bracket']]
        }
      ]
    }
  });

  // 3) Add validation rules with batchUpdate (sheetId-based ranges)
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        // Decks!B2:B1000 -> number between 1 and 5
        {
          setDataValidation: {
            range: {
              sheetId: decksSheetId,
              startRowIndex: 1, // row 2
              endRowIndex: 1000, // exclusive
              startColumnIndex: 1, // column B
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
              startColumnIndex: 0, // column A
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

        // Games!B2:B5000 -> winner 1-4
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

        // Games!C2:F5000 -> Fun / P2 Fun / P3 Fun / P4 Fun 1-5
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

  // Return basic info to the frontend
  return new Response(
    JSON.stringify({
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};
