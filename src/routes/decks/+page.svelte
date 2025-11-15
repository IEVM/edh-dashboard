<script lang="ts">
	import CommanderPreview from '$lib/components/CommanderPreview.svelte';
import { onMount } from 'svelte';

	// comes from +page.server.ts
	export let data: { spreadsheetId: string | null };

	let spreadsheetId = data.spreadsheetId ?? '';
	let values: string[][] = [];
	let loading = false;
	let errorMsg: string | null = null;

	async function loadSheet() {
		errorMsg = null;
		values = [];

		if (!spreadsheetId.length) {
			errorMsg = 'Please enter a spreadsheet ID.';
			return;
		}

		loading = true;
		try {
			const res = await fetch(
				`/api/sheets/read?spreadsheetId=${encodeURIComponent(spreadsheetId)}&range=A1:Z100`
			);

			if (!res.ok) {
				errorMsg = `Error loading sheet: ${res.status}`;
				return;
			}

			const data = await res.json();
			values = data.values ?? [];
		} catch (e) {
			console.error(e);
			errorMsg = 'Unexpected error while loading sheet.';
		} finally {
			loading = false;
		}
	}

	// Auto-load when user already chose a database
	onMount(() => {
		if (spreadsheetId) {
			loadSheet();
		}
	});
</script>

<div class="space-y-8">
	<!-- HEADER -->
	<div class="flex items-end justify-between">
		<h1 class="text-3xl font-semibold">Your Decks</h1>
	</div>

	<!-- ERROR MESSAGE -->
	{#if errorMsg}
		<div class="p-3 rounded-lg bg-error-500/20 text-error-300 text-sm border border-error-600/50">
			{errorMsg}
		</div>
	{/if}

	<!-- DECK PREVIEWS -->
	{#if values.length}
    <div class="flex gap-4 flex-wrap">
      {#each values.slice(1) as row}
        <CommanderPreview deckName={row[0]} summary={row[2]} archidektUrl={row[3]}></CommanderPreview>
      {/each}
    </div>
	{:else}
		Oops no data found.
	{/if}
</div>
