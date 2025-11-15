<script lang="ts">
  import { onMount } from 'svelte';

  type DeckStats = {
    name: string;
    games: number;
    wins: number;
    losses: number;
    winRate: number;        // 0–100
    usagePercent: number;   // 0–100
  };

  export let data: { spreadsheetId: string | null };

  let spreadsheetId: string | null = data.spreadsheetId;
  let loading = false;
  let errorMsg: string | null = null;
  let deckStats: DeckStats[] = [];
  let totalGames = 0;
  let overallWinRate = 0;
  let bestDeck: DeckStats | null = null;

  // Colors for the pie segments (reused in legend)
  const pieColors = [
    'hsl(14, 90%, 57%)',  // red-ish
    'hsl(40, 90%, 55%)',  // orange
    'hsl(82, 60%, 52%)',  // green
    'hsl(200, 80%, 55%)', // blue
    'hsl(280, 70%, 60%)', // purple
    'hsl(330, 70%, 60%)', // pink
    'hsl(190, 60%, 45%)', // teal
    'hsl(50, 80%, 50%)'   // yellow
  ];

  function fmtPct(x: number): string {
    return `${x.toFixed(1)}%`;
  }

  // Winner is a number: 1, 2, 3, 4 ...
  // Here we assume **you are player 1** for your deck.
  // Change '1' to '2' etc. if needed.
  function isWinCell(value: unknown): boolean {
    if (value == null) return false;
    const s = String(value).trim();
    return s === '1';
  }

  async function loadDashboard() {
    errorMsg = null;
    deckStats = [];
    totalGames = 0;
    overallWinRate = 0;
    bestDeck = null;

    if (!spreadsheetId) {
      errorMsg = 'No database selected. Go to Settings and choose a spreadsheet.';
      return;
    }

    loading = true;

    try {
      // Read from Games sheet
      const res = await fetch(
        `/api/sheets/read?spreadsheetId=${encodeURIComponent(
          spreadsheetId
        )}&range=Games!A1:H2000`
      );

      if (!res.ok) {
        errorMsg = `Error loading sheet: ${res.status}`;
        return;
      }

      const { values } = await res.json();

      if (!values || values.length < 2) {
        errorMsg = 'No game data found in the Games sheet.';
        return;
      }

      const headers: string[] = values[0].map((h: string) =>
        (h ?? '').toString().trim().toLowerCase()
      );

      const idxDeck = headers.indexOf('deck');
      const idxWinner = headers.indexOf('winner');

      if (idxDeck === -1 || idxWinner === -1) {
        errorMsg =
          'Could not find the required columns "Deck" and "Winner" in the Games sheet header row.';
        return;
      }

      const rows = values.slice(1);

      // Map deck name -> { games, wins }
      const deckMap = new Map<string, { games: number; wins: number }>();

      for (const row of rows) {
        const deckName = (row[idxDeck] ?? '').toString().trim();
        if (!deckName) continue;

        const winnerCell = row[idxWinner];
        const won = isWinCell(winnerCell);

        const current = deckMap.get(deckName) ?? { games: 0, wins: 0 };
        current.games += 1;
        if (won) current.wins += 1;
        deckMap.set(deckName, current);
      }

      if (deckMap.size === 0) {
        errorMsg = 'No valid game rows found in the Games sheet.';
        return;
      }

      const stats: DeckStats[] = [];
      for (const [name, { games, wins }] of deckMap.entries()) {
        const losses = Math.max(games - wins, 0);
        stats.push({
          name,
          games,
          wins,
          losses,
          winRate: games > 0 ? (wins / games) * 100 : 0,
          usagePercent: 0
        });
      }

      totalGames = stats.reduce((sum, d) => sum + d.games, 0);

      for (const deck of stats) {
        deck.usagePercent =
          totalGames > 0 ? (deck.games / totalGames) * 100 : 0;
      }

      // Sort decks by games played (usage)
      deckStats = stats.sort((a, b) => b.games - a.games);

      const totalWins = deckStats.reduce((sum, d) => sum + d.wins, 0);
      overallWinRate =
        totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

      bestDeck =
        deckStats.length > 0
          ? [...deckStats].sort((a, b) => b.winRate - a.winRate)[0]
          : null;
    } catch (err) {
      console.error(err);
      errorMsg = 'Unexpected error while loading dashboard.';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (spreadsheetId) {
      loadDashboard();
    } else {
      errorMsg = 'No database selected. Go to Settings and choose a spreadsheet.';
    }
  });

  // --- Pie chart using conic-gradient --- //
  $: pieGradient = (() => {
    if (!deckStats.length || totalGames === 0) return '';
    let current = 0;
    const segments: string[] = [];

    for (let i = 0; i < deckStats.length; i++) {
      const d = deckStats[i];
      const start = (current / totalGames) * 360;
      current += d.games;
      const end = (current / totalGames) * 360;
      const color = pieColors[i % pieColors.length];
      segments.push(`${color} ${start}deg ${end}deg`);
    }

    return segments.join(', ');
  })();
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between gap-4">
    <div>
      <h1 class="text-3xl font-semibold">EDH Dashboard</h1>
      <p class="text-surface-300 text-sm">
        Stats generated from the <strong>Games</strong> sheet in your selected database.
      </p>
    </div>
    <button
      class="btn variant-outlined-primary-500 text-sm"
      on:click={loadDashboard}
      disabled={loading}
    >
      {loading ? 'Refreshing…' : 'Refresh'}
    </button>
  </div>

  {#if errorMsg}
    <div class="p-3 rounded-lg bg-error-500/15 border border-error-600/50 text-error-300 text-sm">
      {errorMsg}
    </div>
  {/if}

  {#if deckStats.length}
    <!-- 1) PIE CHART – Deck usage by number of games -->
    <div class="grid gap-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] items-center">
      <div class="flex flex-col items-center gap-2">
        <div
          class="w-48 h-48 rounded-full shadow-lg shadow-black/40 border border-surface-700/60"
          style={`background: conic-gradient(${pieGradient});`}
        />
        <div class="text-xs text-surface-400">
          Deck usage by games played
        </div>
      </div>

      <!-- Legend -->
      <div class="space-y-2">
        <h2 class="text-sm font-semibold text-surface-200">Deck usage</h2>
        <ul class="space-y-1 text-xs">
          {#each deckStats as d, i}
            <li class="flex items-center gap-2">
              <span
                class="w-3 h-3 rounded-sm"
                style={`background: ${pieColors[i % pieColors.length]}`}
              />
              <span class="truncate">{d.name}</span>
              <span class="ml-auto text-surface-300">
                {d.games} game{d.games === 1 ? '' : 's'}
              </span>
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <!-- 2) Summary cards -->
    <div class="grid gap-4 md:grid-cols-3">
      <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
        <div class="text-xs uppercase tracking-wide text-surface-400">
          Total Games Logged
        </div>
        <div class="text-2xl font-semibold">{totalGames}</div>
        <div class="text-xs text-surface-400">
          Across {deckStats.length} deck{deckStats.length === 1 ? '' : 's'}
        </div>
      </div>

      <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
        <div class="text-xs uppercase tracking-wide text-surface-400">
          Overall Win Rate
        </div>
        <div class="text-2xl font-semibold">
          {fmtPct(overallWinRate)}
        </div>
        <div class="mt-1 h-2 rounded-full bg-surface-700/70 overflow-hidden">
          <div
            class="h-full bg-primary-500"
            style={`width: ${Math.min(overallWinRate, 100)}%`}
          />
        </div>
      </div>

      <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
        <div class="text-xs uppercase tracking-wide text-surface-400">
          Best Deck (by win %)
        </div>
        {#if bestDeck}
          <div class="text-base font-semibold">{bestDeck.name}</div>
          <div class="text-xs text-surface-300">
            {bestDeck.wins}–{bestDeck.losses} ({fmtPct(bestDeck.winRate)})
          </div>
        {:else}
          <div class="text-sm text-surface-400">No games yet.</div>
        {/if}
      </div>
    </div>

    <!-- 3) Detailed table -->
    <div class="rounded-xl overflow-hidden border border-surface-700/60 shadow-lg shadow-black/20">
      <table class="w-full text-sm">
        <thead class="bg-surface-800 border-b border-surface-700/60">
          <tr>
            <th class="px-4 py-3 text-left">Deck</th>
            <th class="px-4 py-3 text-right">Games</th>
            <th class="px-4 py-3 text-right">Wins</th>
            <th class="px-4 py-3 text-right">Losses</th>
            <th class="px-4 py-3 text-right">Win %</th>
            <th class="px-4 py-3 text-left w-48">Usage</th>
          </tr>
        </thead>
        <tbody>
          {#each deckStats as d}
            <tr class="bg-surface-900 hover:bg-surface-800/40 border-b border-surface-800/60">
              <td class="px-4 py-2">{d.name}</td>
              <td class="px-4 py-2 text-right">{d.games}</td>
              <td class="px-4 py-2 text-right">{d.wins}</td>
              <td class="px-4 py-2 text-right">{d.losses}</td>
              <td class="px-4 py-2 text-right">{fmtPct(d.winRate)}</td>
              <td class="px-4 py-2">
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-2 rounded-full bg-surface-700 overflow-hidden">
                    <div
                      class="h-full bg-primary-500"
                      style={`width: ${Math.min(d.usagePercent, 100)}%`}
                    />
                  </div>
                  <span class="text-xs text-surface-300 w-12 text-right">
                    {fmtPct(d.usagePercent)}
                  </span>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
