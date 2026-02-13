<script lang="ts">
	import WRBar from '$lib/components/WRBar.svelte';
	import DeckStatsTable from '$lib/components/DeckStatsTable.svelte';
	import type { DeckStatsColumn } from '$lib/components/deck-stats';
	import type { Stats } from '$lib/data/restructure';
	import type { DeckStats } from './+page.server';

	export let data: {
		error?: string;
		stats: Stats | null;
		deckStats: DeckStats[];
		targetWinRate: number;
	};

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

	function bestByFun(key: 'avgFunSelf' | 'avgFunOthers') {
		const candidates = deckStats.filter((d) => d[key] != null);
		if (!candidates.length) return null;
		return [...candidates].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))[0];
	}

	$: bestFunSelf = bestByFun('avgFunSelf');
	$: bestFunOthers = bestByFun('avgFunOthers');

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

	function fmtScore(value: number | null | undefined): string {
		if (value == null || Number.isNaN(value)) return '-';
		return value.toFixed(1);
	}

	function deckHref(id: string) {
		return `/dashboard/${encodeURIComponent(id)}`;
	}

	const overviewColumns: DeckStatsColumn[] = [
		{ key: 'games', label: 'Games', align: 'right', format: 'games', hideOnMobile: false },
		{ key: 'winRate', label: 'Winrate', align: 'right', format: 'percent', hideOnMobile: true },
		{ key: 'usagePercent', label: 'Usage', align: 'right', format: 'percent', hideOnMobile: true }
	];

	const detailColumns: DeckStatsColumn[] = [
		{ key: 'games', label: 'Games', align: 'right', format: 'number' },
		{ key: 'wins', label: 'Wins', align: 'right', format: 'number' },
		{ key: 'losses', label: 'Losses', align: 'right', format: 'number' },
		{ key: 'winRate', label: 'Win rate', align: 'right', format: 'percent' },
		{
			key: 'avgFunSelf',
			label: 'Avg fun you',
			align: 'right',
			format: 'score',
			hideOnMobile: true
		},
		{
			key: 'avgFunOthers',
			label: 'Avg fun others',
			align: 'right',
			format: 'score',
			hideOnMobile: true
		},
		{ key: 'usagePercent', label: 'Usage', align: 'right', format: 'percent', showBar: true }
	];

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
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-semibold">EDH Dashboard</h1>
			<p class="text-surface-300 text-sm">
				Stats generated from your recorded games.
			</p>
		</div>

		<!-- Simple full-page refresh; data is loaded server-side -->
		<button
			class="btn variant-outlined-primary-500 text-sm self-start sm:self-auto"
			type="button"
			on:click={() => location.reload()}
		>
			Refresh
		</button>
	</div>

	{#if errorMsg}
		<div class="p-3 rounded-lg bg-error-500/15 border border-error-600/50 text-error-300 text-sm">
			{errorMsg}
		</div>
	{/if}

	{#if !errorMsg && !deckStats.length}
		<div class="rounded-xl border border-surface-700/60 bg-surface-800 p-4 text-sm text-surface-300">
			<p class="text-surface-200 font-semibold">No games yet.</p>
			<p class="mt-1">
				Add your first deck and log a game to see dashboard stats.
			</p>
			<div class="mt-3">
				<a
					href="/decks"
					class="px-3 py-1 rounded-md bg-primary-500/20 text-primary-200 text-sm border border-primary-500/40 inline-block"
				>
					Go to Decks
				</a>
			</div>
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
				<div class="text-xs text-surface-400 uppercase tracking-wide">Deck overview</div>
				<DeckStatsTable
					rows={deckStats}
					columns={overviewColumns}
					colors={pieColors}
					showColorDot={true}
					linkBase="/dashboard"
					sortable={true}
					initialSortKey="games"
					initialSortDir="desc"
				/>
			</div>
		</div>

		<!-- 2) Summary cards -->
		<div class="grid gap-4 md:grid-cols-3">
			<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 shadow-sm">
				<p class="text-xs text-surface-400 uppercase tracking-wide mb-1">Total games</p>
				<p class="text-3xl font-semibold">{totalGames}</p>
				<p class="text-xs text-surface-400 mt-1">Number of games recorded.</p>
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
			<WRBar winRate={stats.winRate} expectedWinrate={targetWinRate / 100}></WRBar>
		{/if}

		<!-- 4) Best deck highlight -->
		<div class="grid gap-4 md:grid-cols-3">
			{#if bestDeck}
				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 shadow-sm">
					<p class="text-xs text-surface-400 uppercase tracking-wide mb-1">Best deck by win rate</p>
					<p class="text-xl font-semibold">
						<a
							class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
							href={deckHref(bestDeck.id)}
						>
							{bestDeck.name}
						</a>
					</p>
					<p class="text-xs text-surface-400 mt-1">
						{bestDeck.games} game{bestDeck.games === 1 ? '' : 's'} played.
					</p>
					<p class="text-xs text-surface-400 mt-2">Win rate</p>
					<p class="text-2xl font-semibold">{fmtPct(bestDeck.winRate)}</p>
				</div>
			{/if}

			<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 shadow-sm">
				<p class="text-xs text-surface-400 uppercase tracking-wide mb-1">Highest avg fun score</p>
				{#if bestFunSelf}
					<p class="text-xl font-semibold">
						<a
							class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
							href={deckHref(bestFunSelf.id)}
						>
							{bestFunSelf.name}
						</a>
					</p>
					<p class="text-xs text-surface-400 mt-1">
						{bestFunSelf.games} game{bestFunSelf.games === 1 ? '' : 's'} played.
					</p>
					<p class="text-xs text-surface-400 mt-2">Avg fun (you)</p>
					<p class="text-2xl font-semibold">{fmtScore(bestFunSelf.avgFunSelf)}</p>
				{:else}
					<p class="text-sm text-surface-400">No fun scores recorded yet.</p>
				{/if}
			</div>

			<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 shadow-sm">
				<p class="text-xs text-surface-400 uppercase tracking-wide mb-1">
					Best opponent avg fun score
				</p>
				{#if bestFunOthers}
					<p class="text-xl font-semibold">
						<a
							class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
							href={deckHref(bestFunOthers.id)}
						>
							{bestFunOthers.name}
						</a>
					</p>
					<p class="text-xs text-surface-400 mt-1">
						{bestFunOthers.games} game{bestFunOthers.games === 1 ? '' : 's'} played.
					</p>
					<p class="text-xs text-surface-400 mt-2">Avg fun (others)</p>
					<p class="text-2xl font-semibold">{fmtScore(bestFunOthers.avgFunOthers)}</p>
				{:else}
					<p class="text-sm text-surface-400">No opponent fun scores recorded yet.</p>
				{/if}
			</div>
		</div>

		<!-- 5) Detailed table -->
		<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 shadow-sm">
			<div class="flex items-center justify-between mb-3">
				<p class="text-xs text-surface-400 uppercase tracking-wide">Deck details</p>
				<p class="text-xs text-surface-400">Sorted by games played.</p>
			</div>
			<DeckStatsTable
				rows={deckStats}
				columns={detailColumns}
				linkBase="/dashboard"
				sortable={true}
				initialSortKey="games"
				initialSortDir="desc"
			/>
		</div>
	{/if}
</div>
