<script lang="ts">
	import CommanderPreview from '$lib/components/CommanderPreview.svelte';
	import type { Deck } from '$lib/data/restructure';

	// This is what the server load returns
	export let data: {
		error?: string;
		decks: Deck[];
	};

	const { error, decks } = data;
</script>

<div class="space-y-8">
	<!-- HEADER -->
	<div class="flex items-end justify-between">
		<h1 class="text-3xl font-semibold">Your Decks</h1>
	</div>

	<!-- ERROR MESSAGE -->
	{#if error}
		<div class="p-3 rounded-lg bg-error-500/20 text-error-300 text-sm border border-error-600/50">
			{error}
		</div>
	{/if}

	<!-- DECK PREVIEWS -->
	{#if decks.length}
		<div class="flex gap-4 flex-wrap">
			{#each decks as deck}
				<CommanderPreview
					deckName={deck.deckName}
					summary={deck.summary}
					archidektUrl={deck.archidektLink}
				></CommanderPreview>
			{/each}
		</div>
	{:else}
		Oops no data found.
	{/if}
</div>
