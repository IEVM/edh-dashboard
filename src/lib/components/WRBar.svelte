<script lang="ts">
	export let winRate: number;
	export let expectedWinrate: number;
	export let width: number = 2;

	/** Formats a number already in 0..100 percent. */
	function fmtPct(x: number): string {
		return `${(100 * x).toFixed(1)}%`;
	}
</script>

<div
	class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-{width} md:col-span-{width}"
>
	<div class="flex items-center justify-between text-xs text-surface-400 uppercase tracking-wide">
		<span>Overall vs target</span>
		<span>{fmtPct(winRate)} / {fmtPct(expectedWinrate)}</span>
	</div>
	<div class="w-full h-3 rounded-full bg-surface-900 overflow-hidden flex">
		<!-- Base: fair expected win rate -->
		<div
			class="h-full bg-primary-500"
			style={`width: ${100 * Math.min(winRate, expectedWinrate)}%;`}
		/>
		{#if winRate - expectedWinrate > 0}
			<!-- Overperforming -->
			<div class="h-full bg-success-500" style={`width: ${100 * (winRate - expectedWinrate)}%;`} />
		{:else if winRate - expectedWinrate < 0}
			<!-- Underperforming -->
			<div class="h-full bg-error-500" style={`width: ${100 * (expectedWinrate - winRate)}%;`} />
		{/if}
	</div>
	<div class="text-xs text-surface-400">
		{#if winRate - expectedWinrate > 0}
			You're winning {(100 * (winRate - expectedWinrate)).toFixed(1)} percentage points more than a perfectly
			fair deck.
		{:else if winRate - expectedWinrate < 0}
			You're winning {(100 * Math.abs(winRate - expectedWinrate)).toFixed(1)} percentage points less
			than a fair deck.
		{:else}
			You're exactly at the fair win rate.
		{/if}
	</div>
</div>
