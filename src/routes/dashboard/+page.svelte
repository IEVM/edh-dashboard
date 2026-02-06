<script lang="ts">
	import WRBar from '$lib/components/WRBar.svelte';
	import type { Stats } from '$lib/data/restructure';
	import type { DeckStats } from './+page.server';

	export let data: {
		spreadsheetId: string | null;
		error?: string;
		stats: Stats | null;
		deckStats: DeckStats[];
		targetWinRate: number;
	};

	const spreadsheetId = data.spreadsheetId;
	let errorMsg: string | null = data.error ?? null;
	let stats: Stats | null = data.stats;
	let deckStats: DeckStats[] = data.deckStats;
	let targetWinRate = data.targetWinRate;

	// Derived values for the UI
	$: totalGames = stats?.totalGames ?? 0;

	// `Stats.winRate` is 0..1; this page displays 0..100.
	$: overallWinRate = stats ? stats.winRate * 100 : 0;

	$: bestDeck =
		deckStats.length > 0 ? [...deckStats].sort((a, b) => b.winRate - a.winRate)[0] : null;

	// Colors for the pie segments (reused in legend)
	const pieColors = [
		'hsl(14, 90%, 57%)', // red-ish
		'hsl(40, 90%, 55%)', // orange
		'hsl(82, 60%, 52%)', // green
		'hsl(200, 80%, 55%)', // blue
		'hsl(280, 70%, 60%)', // purple
		'hsl(330, 70%, 60%)', // pink
		'hsl(190, 60%, 45%)', // teal
		'hsl(50, 80%, 50%)' // yellow
	];

	/** Formats a number already in 0..100 percent. */
	function fmtPct(x: number): string {
		return `${x.toFixed(1)}%`;
	}

	function deckHref(name: string) {
		return `/dashboard/${encodeURIComponent(name)}`;
	}

	// Pie chart using conic-gradient
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

		<!-- Simple full-page refresh; data is loaded server-side -->
		<button
			class="btn variant-outlined-primary-500 text-sm"
			type="button"
			on:click={() => location.reload()}
			disabled={!spreadsheetId}
		>
			Refresh
		</button>
	</div>

	{#if errorMsg}
		<div class="p-3 rounded-lg bg-error-500/15 border border-error-600/50 text-error-300 text-sm">
			{errorMsg}
		</div>
	{/if}

	{#if !errorMsg && !spreadsheetId}
		<div
			class="p-3 rounded-lg bg-surface-800 border border-surface-700/60 text-surface-200 text-sm"
		>
			No database selected. Go to <strong>Settings</strong> and choose a spreadsheet.
		</div>
	{/if}

	{#if !errorMsg && deckStats.length}
		<!-- 1) PIE CHART – Deck usage by number of games -->
		<div class="grid gap-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)] items-center">
			<div class="flex flex-col items-center gap-2">
				<div
					class="w-48 h-48 rounded-full border border-surface-600 shadow-inner"
					style={`background: conic-gradient(${pieGradient});`}
				/>
				<p class="text-xs text-surface-300">Each segment shows how many games a deck has played.</p>
			</div>

			<div class="space-y-3">
				<div
					class="flex items-center justify-between text-xs text-surface-400 uppercase tracking-wide"
				>
					<span>Deck</span>
					<span class="flex gap-6">
						<span class="w-12 text-right">Games</span>
						<span class="w-16 text-right">Winrate</span>
						<span class="w-16 text-right">Usage</span>
					</span>
				</div>

				<ul class="space-y-2">
					{#each deckStats as d, i}
						<li class="flex items-center gap-3 text-sm">
							<span
								class="inline-block w-3 h-3 rounded-full"
								style={`background: ${pieColors[i % pieColors.length]}`}
							/>
							<a
								class="truncate text-primary-300 hover:text-primary-200 underline underline-offset-2"
								href={deckHref(d.name)}
							>
								{d.name}
							</a>
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
			<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 shadow-sm">
				<p class="text-xs text-surface-400 uppercase tracking-wide mb-1">Total games</p>
				<p class="text-3xl font-semibold">{totalGames}</p>
				<p class="text-xs text-surface-400 mt-1">
					Number of games recorded in the <strong>Games</strong> sheet.
				</p>
			</div>

			<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 shadow-sm">
				<p class="text-xs text-surface-400 uppercase tracking-wide mb-1">Overall win rate</p>
				<p class="text-3xl font-semibold">{fmtPct(overallWinRate)}</p>
				<p class="text-xs text-surface-400 mt-1">Percentage of games you won with your decks.</p>
			</div>

			<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 shadow-sm">
				<p class="text-xs text-surface-400 uppercase tracking-wide mb-1">Fairness target</p>
				<p class="text-3xl font-semibold">{fmtPct(targetWinRate)}</p>
				<p class="text-xs text-surface-400 mt-1">
					Expected win rate if every game was perfectly fair.
				</p>
			</div>
		</div>

		<!-- 3) Winrate vs target bar -->
		{#if stats}
			<WRBar winRate={stats.winRate} expectedWinrate={stats.expectedWinrate}></WRBar>
		{/if}

		<!-- 4) Best deck highlight -->
		{#if bestDeck}
			<div
				class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3"
			>
				<div>
					<p class="text-xs text-surface-400 uppercase tracking-wide mb-1">Best deck by win rate</p>
					<p class="text-xl font-semibold">
						<a
							class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
							href={deckHref(bestDeck.name)}
						>
							{bestDeck.name}
						</a>
					</p>
					<p class="text-xs text-surface-400 mt-1">
						{bestDeck.games} game{bestDeck.games === 1 ? '' : 's'} played.
					</p>
				</div>
				<div class="flex flex-col items-end">
					<p class="text-xs text-surface-400 uppercase tracking-wide mb-1">Win rate</p>
					<p class="text-2xl font-semibold">{fmtPct(bestDeck.winRate)}</p>
				</div>
			</div>
		{/if}

		<!-- 5) Detailed table -->
		<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 shadow-sm">
			<div class="flex items-center justify-between mb-3">
				<p class="text-xs text-surface-400 uppercase tracking-wide">Deck details</p>
				<p class="text-xs text-surface-400">Sorted by games played.</p>
			</div>

			<table class="w-full text-sm">
				<thead class="text-xs text-surface-400 border-b border-surface-700/60">
					<tr>
						<th class="py-2 text-left">Deck</th>
						<th class="py-2 text-right">Games</th>
						<th class="py-2 text-right">Wins</th>
						<th class="py-2 text-right">Losses</th>
						<th class="py-2 text-right">Win rate</th>
						<th class="py-2 text-right">Usage</th>
					</tr>
				</thead>
				<tbody>
					{#each deckStats as d}
						<tr class="border-t border-surface-800/60">
							<td class="py-2 pr-2">
								<a
									class="truncate block max-w-xs text-primary-300 hover:text-primary-200 underline underline-offset-2"
									href={deckHref(d.name)}
								>
									{d.name}
								</a>
							</td>
							<td class="py-2 text-right">{d.games}</td>
							<td class="py-2 text-right">{d.wins}</td>
							<td class="py-2 text-right">{d.losses}</td>
							<td class="py-2 text-right">{fmtPct(d.winRate)}</td>
							<td class="py-2 text-right">
								<div class="flex items-center justify-end gap-2">
									<div class="w-16 h-1.5 bg-surface-900 rounded-full overflow-hidden">
										<div
											class="h-full bg-primary-500"
											style={`width: ${d.usagePercent.toFixed(1)}%`}
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
