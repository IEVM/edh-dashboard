<script lang="ts">
	export type DeckStatsRow = {
		name: string;
		games: number;
		wins: number;
		losses: number;
		winRate: number; // 0 to 100
		usagePercent: number; // 0 to 100
		avgFunSelf?: number | null;
		avgFunOthers?: number | null;
	};

	export type DeckStatsColumn = {
		key: 'games' | 'wins' | 'losses' | 'winRate' | 'usagePercent' | 'avgFunSelf' | 'avgFunOthers';
		label: string;
		align?: 'left' | 'right';
		format?: 'number' | 'percent' | 'games' | 'score';
		showBar?: boolean;
		hideOnMobile?: boolean;
		sortable?: boolean;
	};

	export let rows: DeckStatsRow[] = [];
	export let columns: DeckStatsColumn[] = [];
	export let colors: string[] = [];
	export let showColorDot = false;
	export let linkBase = '/dashboard';
	export let sortable = true;
	export let initialSortKey: DeckStatsColumn['key'] | null = null;
	export let initialSortDir: 'asc' | 'desc' = 'desc';

	let sortKey: DeckStatsColumn['key'] | null = initialSortKey;
	let sortDir: 'asc' | 'desc' = initialSortDir;

	function deckHref(name: string) {
		return `${linkBase}/${encodeURIComponent(name)}`;
	}

	function rowColor(index: number) {
		if (!colors.length) return 'hsl(260, 60%, 60%)';
		return colors[index % colors.length];
	}

	function formatValue(row: DeckStatsRow, column: DeckStatsColumn): string {
		const value = row[column.key] as number | null | undefined;
		if (value == null || Number.isNaN(value)) return '-';
		const format =
			column.format ??
			(column.key === 'winRate' || column.key === 'usagePercent' ? 'percent' : 'number');

		if (format === 'percent') return `${value.toFixed(1)}%`;
		if (format === 'score') return `${value.toFixed(1)}`;
		if (format === 'games') return `${value} game${value === 1 ? '' : 's'}`;
		return `${value}`;
	}

	function cellAlignClass(column: DeckStatsColumn) {
		return column.align === 'right' ? 'text-right' : 'text-left';
	}

	function cellVisibilityClass(column: DeckStatsColumn) {
		return column.hideOnMobile ? 'hidden sm:table-cell' : 'table-cell';
	}

	function canSort(column: DeckStatsColumn) {
		return sortable && column.sortable !== false;
	}

	function toggleSort(column: DeckStatsColumn) {
		if (!canSort(column)) return;
		if (sortKey === column.key) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortKey = column.key;
			sortDir = 'desc';
		}
	}

	function compareValues(a: number | null | undefined, b: number | null | undefined) {
		const aMissing = a == null || Number.isNaN(a);
		const bMissing = b == null || Number.isNaN(b);
		if (aMissing && bMissing) return 0;
		if (aMissing) return 1;
		if (bMissing) return -1;
		return a - b;
	}

	$: sortedRows = sortKey
		? [...rows].sort((a, b) => {
				const diff = compareValues(a[sortKey] as number, b[sortKey] as number);
				return sortDir === 'asc' ? diff : -diff;
			})
		: rows;
</script>

<div class="overflow-x-auto -mx-2 sm:mx-0">
	<table class="w-full text-sm min-w-[360px] sm:min-w-[640px]">
		<thead class="text-xs text-surface-400 border-b border-surface-700/60">
			<tr>
				<th class="py-2 text-left">Deck</th>
				{#each columns as column}
					<th class={`py-2 ${cellAlignClass(column)} ${cellVisibilityClass(column)}`}>
						{#if canSort(column)}
							<button
								type="button"
								class="inline-flex items-center gap-1 hover:text-surface-200"
								on:click={() => toggleSort(column)}
							>
								<span>{column.label}</span>
								{#if sortKey === column.key}
									<span class="hidden sm:inline text-[10px] text-surface-500">
										{sortDir}
									</span>
									<span class="sm:hidden text-[10px] text-surface-500">
										{@html sortDir === 'asc' ? '&uarr;' : '&darr;'}
									</span>
								{/if}
							</button>
						{:else}
							{column.label}
						{/if}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each sortedRows as row, index}
				<tr class="border-t border-surface-800/60">
					<td class="py-2 pr-2">
						<div class="flex items-center gap-2">
							{#if showColorDot}
								<span
									class="inline-block w-3 h-3 rounded-full"
									style={`background: ${rowColor(index)}`}
								/>
							{/if}
							<a
								class="truncate block max-w-xs text-primary-300 hover:text-primary-200 underline underline-offset-2"
								href={deckHref(row.name)}
							>
								{row.name}
							</a>
						</div>
					</td>
					{#each columns as column}
						<td class={`py-2 ${cellAlignClass(column)} ${cellVisibilityClass(column)}`}>
							{#if column.showBar}
								<div class="flex items-center justify-end gap-2">
									<div class="w-16 h-1.5 bg-surface-900 rounded-full overflow-hidden">
										<div
											class="h-full bg-primary-500"
											style={`width: ${row.usagePercent.toFixed(1)}%`}
										/>
									</div>
									<span class="text-xs text-surface-300 w-12 text-right">
										{formatValue(row, column)}
									</span>
								</div>
							{:else}
								<span class={column.key === 'games' ? 'text-surface-300' : ''}>
									{formatValue(row, column)}
								</span>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
