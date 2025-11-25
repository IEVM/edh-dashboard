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
      expectedWinrate: number;
      avgFunSelf: number | null;
      stdFunSelf: number | null;
      avgFunOthers: number | null;
      avgFunWins: number | null;
      avgFunLosses: number | null;
      avgEstBracket: number | null;
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

  function fmtNum(x: number | null, digits = 1) {
    return x == null ? '-' : x.toFixed(digits);
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
  <div class="grid gap-4 md:grid-cols-3">
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
      <div class="text-xs text-surface-400">
        {fmtPct(stats.winRate)}
      </div>
    </div>

    <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
      <div class="text-xs uppercase tracking-wide text-surface-400">
        Avg fun (you)
      </div>
      <div class="text-lg font-semibold">
        {fmtNum(stats.avgFunSelf)}
      </div>
      <div class="text-xs text-surface-400">
        Std dev: {fmtNum(stats.stdFunSelf, 2)}
      </div>
    </div>

    <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
      <div class="text-xs uppercase tracking-wide text-surface-400">
        Table fun (others)
      </div>
      <div class="text-lg font-semibold">
        {fmtNum(stats.avgFunOthers)}
      </div>
    </div>
    <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-2">
      <div class="text-xs uppercase tracking-wide text-surface-400">
        Fun when you win
      </div>
      <div class="text-lg font-semibold">
        {fmtNum(stats.avgFunWins)}
      </div>
    </div>

    <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-2">
      <div class="text-xs uppercase tracking-wide text-surface-400">
        Fun when you lose
      </div>
      <div class="text-lg font-semibold">
        {fmtNum(stats.avgFunLosses)}
      </div>
    </div>

    <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-2">
				<div class="text-xs uppercase tracking-wide text-surface-400">
					Overall Win Rate vs Fair Target
				</div>
				<div class="flex items-baseline gap-3">
					<div class="text-2xl font-semibold">
						{fmtPct(stats.winRate)}
					</div>
					<div class="text-xs text-surface-400">
						Fair target: {fmtPct(stats.expectedWinrate)}
					</div>
				</div>
				<div class="mt-1 h-2 rounded-full bg-surface-700/70 overflow-hidden flex">
					<!-- shared (fair) part -->
					<div class="h-full bg-primary-500" style={`width: ${Math.min(stats.expectedWinrate, stats.winRate)}%;`} />
					<!-- difference segment (above or below fair) -->
					{#if stats.winRate - stats.expectedWinrate > 0}
						<div
							class="h-full bg-error-500"
							style={`width: ${stats.winRate - stats.expectedWinrate}%;`}
						/>
					{/if}
				</div>
				<div class="text-xs text-surface-400">
					{#if stats.winRate - stats.expectedWinrate > 0}
						You&#39;re winning {(stats.winRate - stats.expectedWinrate).toFixed(1)} percentage points more than a perfectly fair deck.
					{:else if stats.winRate - stats.expectedWinrate < 0}
						You&#39;re winning {Math.abs(stats.winRate - stats.expectedWinrate).toFixed(1)} percentage points less than a fair deck.
					{:else}
						You&#39;re exactly at the fair win rate.
					{/if}
				</div>
			</div>

    <div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-2">
      <div class="text-xs uppercase tracking-wide text-surface-400">
        Avg est. pod bracket
      </div>
      <div class="text-lg font-semibold">
        {fmtNum(stats.avgEstBracket)}
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
                  {g.fun ?? '-'}
                </td>
                <td class="px-4 py-2 text-right">
                  {g.estBracket ?? '-'}
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
