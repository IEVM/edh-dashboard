<script lang="ts">
	import CommanderPreview from '$lib/components/CommanderPreview.svelte';
	import type { Deck } from '$lib/data/restructure';

	export let data: {
		spreadsheetId: string | null;
		deck: Deck | null;
		error?: string;
	};

	const { deck, error } = data;
	/**
	 * Format a nullable number. Returns "-" if null/undefined.
	 * @param value   Number to format
	 * @param digits  Number of decimal places (default 1)
	 */
	function fmtNum(value: number | null | undefined, digits = 1): string {
		if (value == null || Number.isNaN(value)) return '-';
		return value.toFixed(digits);
	}

	/**
	 * Format a percentage value (0–100) with one decimal place and a % sign.
	 * If you pass a 0–1 winrate, multiply by 100 before calling.
	 */
	function fmtPct(percent: number | null | undefined, digits = 1): string {
		if (percent == null || Number.isNaN(percent)) return '-';
		return `${percent.toFixed(digits)}%`;
	}

	/**
	 * Human-readable label for a winner flag.
	 * 1 => "Win", 0 => "Loss", null/other => "–"
	 */
	function resultLabel(winner: number | null | undefined): string {
		if (winner === 1) return 'Win';
		if (winner === 0) return 'Loss';
		return '–';
	}

	/**
	 * Tailwind/CSS class to color the result text.
	 * Adjust the class names to match your design system.
	 */
	function resultClass(winner: number | null | undefined): string {
		if (winner === 1) return 'text-success-400';
		if (winner === 0) return 'text-error-400';
		return 'text-surface-300';
	}

	/**
	 * Compute the average "fun" score of other players (p2–p4) for a single game.
	 * Returns "-" if there are no values.
	 */
	function avgFunOthers(
		game: {
			p2Fun: number | null;
			p3Fun: number | null;
			p4Fun: number | null;
		},
		digits = 1
	): string {
		const values = [game.p2Fun, game.p3Fun, game.p4Fun].filter((v): v is number => v != null);

		if (!values.length) return '–';

		const sum = values.reduce((a, b) => a + b, 0);
		return (sum / values.length).toFixed(digits);
	}
</script>

<div class="space-y-6">
	{#if error}
		<h1 class="text-3xl font-semibold">An error occured</h1>
		<p class="text-sm text-surface-300 max-w-xl">error</p>
	{:else if !deck}
		<h1 class="text-3xl font-semibold">Missing Deck</h1>
		<p class="text-sm text-surface-300 max-w-xl">
			There seems to not be a deck with the specified name in your database.
		</p>
	{:else}
		<!-- Header -->
		<div class="flex items-start justify-between gap-4">
			<div class="space-y-2">
				<h1 class="text-3xl font-semibold">{deck.deckName}</h1>

				{#if deck.summary}
					<p class="text-sm text-surface-300 max-w-xl">
						{deck.summary}
					</p>
				{/if}

				<div class="flex flex-wrap items-center gap-3 text-xs text-surface-400">
					{#if deck.targetBracket !== null}
						<span>
							Target bracket:
							<strong class="text-surface-100">{deck.targetBracket}</strong>
						</span>
					{/if}

					{#if deck.archidektLink && deck.archidektLink !== '-'}
						<a
							href={deck.archidektLink}
							target="_blank"
							rel="noreferrer"
							class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
						>
							View on Archidekt
						</a>
					{/if}
				</div>
			</div>

			{#if deck.archidektLink && deck.archidektLink !== '-'}
				<CommanderPreview archidektUrl={deck.archidektLink} summary={deck.summary ?? ''} />
			{/if}
		</div>

		{#if error}
			<div class="p-3 rounded-lg bg-error-500/15 border border-error-600/50 text-error-300 text-sm">
				{error}
			</div>
		{/if}

		<!-- Quick stats -->
		{#if deck.stats}
			<div class="grid gap-4 md:grid-cols-3">
				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
					<div class="text-xs uppercase tracking-wide text-surface-400">Games played</div>
					<div class="text-2xl font-semibold">
						{deck.stats.totalGames}
					</div>
				</div>

				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
					<div class="text-xs uppercase tracking-wide text-surface-400">Record</div>
					<div class="text-lg font-semibold">
						{deck.stats.wins}–{deck.stats.losses}
					</div>
					<div class="text-xs text-surface-400">
						{fmtPct(deck.stats.winRate)}
					</div>
				</div>

				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
					<div class="text-xs uppercase tracking-wide text-surface-400">Avg fun (you)</div>
					<div class="text-lg font-semibold">
						{fmtNum(deck.stats.avgFunSelf)}
					</div>
					<div class="text-xs text-surface-400">
						Std dev: {fmtNum(deck.stats.stdFunSelf, 2)}
					</div>
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-3">
				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-2">
					<div class="text-xs uppercase tracking-wide text-surface-400">Avg est. pod bracket</div>
					<div class="text-lg font-semibold">
						{fmtNum(deck.stats.avgEstBracket)}
					</div>
				</div>

				<div
					class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-2 md:col-span-2"
				>
					<div class="text-xs uppercase tracking-wide text-surface-400">Win rate vs fair</div>
					<div class="w-full h-3 rounded-full bg-surface-900 overflow-hidden flex">
						<!-- Base: fair expected win rate -->
						<div
							class="h-full bg-primary-500"
							style={`width: ${Math.max(0, deck.stats.expectedWinrate)}%;`}
						/>
						{#if deck.stats.winRate - deck.stats.expectedWinrate > 0}
							<!-- Overperforming -->
							<div
								class="h-full bg-success-500"
								style={`width: ${deck.stats.winRate - deck.stats.expectedWinrate}%;`}
							/>
						{:else if deck.stats.winRate - deck.stats.expectedWinrate < 0}
							<!-- Underperforming -->
							<div
								class="h-full bg-error-500"
								style={`width: ${Math.abs(deck.stats.winRate - deck.stats.expectedWinrate)}%;`}
							/>
						{/if}
					</div>
					<div class="text-xs text-surface-400">
						{#if deck.stats.winRate - deck.stats.expectedWinrate > 0}
							You're winning {(deck.stats.winRate - deck.stats.expectedWinrate).toFixed(1)} percentage
							points more than a perfectly fair deck.
						{:else if deck.stats.winRate - deck.stats.expectedWinrate < 0}
							You're winning
							{Math.abs(deck.stats.winRate - deck.stats.expectedWinrate).toFixed(1)} percentage points
							less than a fair deck.
						{:else}
							You're exactly at the fair win rate.
						{/if}
					</div>
				</div>
			</div>
		{:else}
			<p class="text-sm text-surface-400">No games logged yet for this deck.</p>
		{/if}

		<!-- Games -->
		{#if !deck.games}
			<p class="text-sm text-surface-400">
				There have been no games in your database with this deck.
			</p>
		{:else}
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-semibold">Games</h2>
					<p class="text-xs text-surface-400">
						Showing {deck.games.length} game{deck.games.length === 1 ? '' : 's'} for this deck.
					</p>
				</div>

				{#if deck.games.length}
					<div class="overflow-x-auto rounded-xl border border-surface-700/60 bg-surface-900/40">
						<table class="min-w-full text-sm">
							<thead class="text-xs text-surface-400 bg-surface-900 border-b border-surface-700/60">
								<tr>
									<th class="px-3 py-2 text-left">#</th>
									<th class="px-3 py-2 text-left">Result</th>
									<th class="px-3 py-2 text-right">Fun (you)</th>
									<th class="px-3 py-2 text-right">Fun (others)</th>
									<th class="px-3 py-2 text-right">Est. bracket</th>
									<th class="px-3 py-2 text-left">Notes</th>
								</tr>
							</thead>
							<tbody>
								{#each deck.games as g, i}
									<tr class="border-t border-surface-800/60">
										<td class="px-3 py-2 text-xs text-surface-400">
											{i + 1}
										</td>
										<td class={`px-3 py-2 text-xs font-medium ${resultClass(g.winner)}`}>
											{resultLabel(g.winner)}
										</td>
										<td class="px-3 py-2 text-right text-surface-100">
											{g.fun == null ? '–' : g.fun.toFixed(1)}
										</td>
										<td class="px-3 py-2 text-right text-surface-100">
											{avgFunOthers(g)}
										</td>
										<td class="px-3 py-2 text-right text-surface-100">
											{g.estBracket == null ? '–' : g.estBracket.toFixed(1)}
										</td>
										<td class="px-3 py-2 text-xs text-surface-300 max-w-xs truncate">
											{g.notes ?? ''}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-sm text-surface-400">No games logged yet for this deck.</p>
				{/if}
			</div>
		{/if}

		<div class="pt-4">
			<a
				href="/dashboard"
				class="text-sm text-primary-300 hover:text-primary-200 underline underline-offset-2"
			>
				← Back to overall dashboard
			</a>
		</div>
	{/if}
</div>
