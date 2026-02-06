import { describe, expect, it, vi, afterEach } from 'vitest';
import { loadMoxfieldDeck } from '$lib/deck-links/moxfield';

type MockResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

function mockFetchOnce(payload: unknown, ok = true, status = 200) {
  const res: MockResponse = {
    ok,
    status,
    json: async () => payload
  };
  vi.stubGlobal('fetch', vi.fn(async () => res));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loadMoxfieldDeck', () => {
  it('uses image_uris when present', async () => {
    mockFetchOnce({
      name: 'Test Deck',
      commanders: [
        {
          card: {
            name: 'Commander One',
            image_uris: {
              art_crop: 'https://images.example/art.jpg'
            }
          }
        }
      ]
    });

    const data = await loadMoxfieldDeck('abc123');

    expect(data.name).toBe('Test Deck');
    expect(data.image).toBe('https://images.example/art.jpg');
    expect(data.commanders).toEqual(['Commander One']);
  });

  it('falls back to scryfall_id image when image_uris are missing', async () => {
    mockFetchOnce({
      name: 'Fallback Deck',
      commanders: [
        {
          card: {
            name: 'Commodore Guff',
            scryfall_id: '92870fc6-a6bc-4198-bb31-397e07e0e835'
          }
        }
      ]
    });

    const data = await loadMoxfieldDeck('def456');

    expect(data.image).toBe(
      'https://cards.scryfall.io/art_crop/front/9/2/92870fc6-a6bc-4198-bb31-397e07e0e835.jpg'
    );
  });
});
