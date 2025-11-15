<script lang="ts">
  import CommanderPreview from '$lib/components/CommanderPreview.svelte';

  export let data: {
    deckName: string;
    spreadsheetId: string | null;
    deckMeta: {
      name: string;
      targetBracket: number | null;
      summary: string | null;
      archidektLink: string | null;
    };
    stats: {
      totalGames: number;
      wins: number;
      losses: number;
      winRate: number;
      avgFun: number | null;
    };
    games: Array<{
      winner: number | null;
      fun: number | null;
      p2Fun: number | null;
      p3Fun: number | null;
      p4Fun: number | null;
      notes: string | null;
      estBracket: number | null;
    }>;
    error?: string;
  };

  const { deckName, deckMeta, stats, games } = data;

  function fmtPct(x: number) {
    return `${x.toFixed(1)}%`;
  }

  function fmtNum(x: number | null) {
    return x == null ? '–' : x.toFixed(1);
  }
</script>

<section class="space-y-8 max-w-5xl mx-auto">
  <div class="flex items-start justify-between gap-4">
    <div class="space-y-2">
      <h1 class="text-3xl font-semibold">{deckName}</h1>
      {#if deckMeta.summary}
        <p class="text-sm text-surface-300 max-w-xl">
          {deckMeta.summary}
        </p>
      {/if}
      <div class="flex flex-wrap items-center gap-3 text-xs text-surface-400">
        {#if deckMeta.targetBracket}
          <span>
            Target bracket: <strong class="text-surface-100">{deckMeta.targetBracket}</strong>
          </span>
        {/if}
        {#if deckMeta.archidektLink && deckMeta.archidektLink !== '-'}
          <a
            href={deckMeta.archidektLink}
            target="_blank"
            rel="noreferrer"
            class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
          >
            View on Archidekt
          </a>
        {/if}
      </div>
    </div>

    {#if deckMeta.archidektLink && deckMeta.archidektLink !== '-'}
      <CommanderPreview
        archidektUrl={deckMeta.archidektLink}
        summary={deckMeta.summary ?? ''}
      />
    {/if}
  </div>

  {#if data.error}
    <div class="p-3 rounded-lg bg-error-500/15 border border-error-600/50 text-error-300 text-sm">
      {data.error}
    </div>
  {/if}

  <!-- Quick stats -->
  <div class="grid gap-4 md:grid-cols-4">
    <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
      <div class="text-xs uppercase tracking-wide text-surface-400">
        Games played
      </div>
      <div class="text-2xl font-semibold">
        {stats.totalGames}
      </div>
    </div>
    <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
      <div class="text-xs uppercase tracking-wide text-surface-400">
        Record
      </div>
      <div class="text-lg font-semibold">
        {stats.wins}–{stats.losses}
      </div>
    </div>
    <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
      <div class="text-xs uppercase tracking-wide text-surface-400">
        Win rate
      </div>
      <div class="text-lg font-semibold">
        {fmtPct(stats.winRate)}
      </div>
    </div>
    <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
      <div class="text-xs uppercase tracking-wide text-surface-400">
        Avg fun (your seat)
      </div>
      <div class="text-lg font-semibold">
        {fmtNum(stats.avgFun)}
      </div>
    </div>
  </div>

  <!-- Recent games -->
  <div class="space-y-3">
    <h2 class="text-lg font-semibold">Recent games</h2>
    {#if games.length}
      <div class="rounded-xl overflow-hidden border border-surface-700/60 shadow-lg shadow-black/20">
        <table class="w-full text-sm">
          <thead class="bg-surface-800 border-b border-surface-700/60">
            <tr>
              <th class="px-4 py-2 text-left">Result</th>
              <th class="px-4 py-2 text-right">Fun</th>
              <th class="px-4 py-2 text-right">Est. bracket</th>
              <th class="px-4 py-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {#each games.slice(-30).reverse() as g}
              <tr class="bg-surface-900 hover:bg-surface-800/40 border-b border-surface-800/60">
                <td class="px-4 py-2">
                  {#if g.winner === 1}
                    <span class="text-xs rounded-full px-2 py-1 bg-success-600/40 text-success-200 border border-success-500/60">
                      Win
                    </span>
                  {:else}
                    <span class="text-xs rounded-full px-2 py-1 bg-error-600/40 text-error-200 border border-error-500/60">
                      Loss
                    </span>
                  {/if}
                </td>
                <td class="px-4 py-2 text-right">
                  {g.fun ?? '–'}
                </td>
                <td class="px-4 py-2 text-right">
                  {g.estBracket ?? '–'}
                </td>
                <td class="px-4 py-2 text-xs text-surface-300">
                  {g.notes ?? ''}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="text-sm text-surface-400">
        No games logged yet for this deck.
      </p>
    {/if}
  </div>

  <div class="pt-4">
    <a
      href="/dashboard"
      class="text-sm text-primary-300 hover:text-primary-200 underline underline-offset-2"
    >
      ← Back to overall dashboard
    </a>
  </div>
</section>
