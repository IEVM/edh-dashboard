<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import CommanderPreview from '$lib/components/CommanderPreview.svelte';
	import type { Deck } from '$lib/data/restructure';

	export let data: {
		error?: string;
		decks: Deck[];
	};

	// Destructure for simpler markup.
	const { error, decks } = data;

	let addingDeck = false;
	let savingDeck = false;
	let formError = '';

	let newDeck = {
		deckName: '',
		targetBracket: '',
		summary: '',
		archidektLink: ''
	};

	function resetNewDeck() {
		newDeck = {
			deckName: '',
			targetBracket: '',
			summary: '',
			archidektLink: ''
		};
	}

	async function saveDeck() {
		formError = '';

		if (!newDeck.deckName.trim()) {
			formError = 'Please enter a deck name.';
			return;
		}

		savingDeck = true;
		try {
			const targetBracket = newDeck.targetBracket ? Number(newDeck.targetBracket) : null;
			const res = await fetch('/api/decks/append', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					deckName: newDeck.deckName.trim(),
					targetBracket,
					summary: newDeck.summary.trim() || null,
					archidektLink: newDeck.archidektLink.trim() || null
				})
			});

			if (!res.ok) {
				formError = await res.text();
				return;
			}

			resetNewDeck();
			addingDeck = false;
			await invalidateAll();
		} finally {
			savingDeck = false;
		}
	}
</script>

<div class="space-y-8">
	<!-- Header -->
	<div class="flex items-end justify-between flex-wrap gap-3">
		<h1 class="text-3xl font-semibold">Your Decks</h1>
		<button
			class="px-3 py-1 rounded-md bg-primary-500/20 text-primary-200 text-sm border border-primary-500/40"
			type="button"
			on:click={() => (addingDeck = !addingDeck)}
		>
			{addingDeck ? 'Cancel' : 'Add deck'}
		</button>
	</div>

	{#if addingDeck}
		<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-3">
			<h2 class="text-lg font-semibold">New Deck</h2>

			<div class="grid gap-3 sm:grid-cols-2">
				<label class="space-y-1 text-sm">
					<span class="text-surface-300">Name</span>
					<input
						class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
						type="text"
						bind:value={newDeck.deckName}
					/>
				</label>

				<label class="space-y-1 text-sm">
					<span class="text-surface-300">Target bracket</span>
					<input
						class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
						type="number"
						min="1"
						max="5"
						step="1"
						bind:value={newDeck.targetBracket}
					/>
				</label>
			</div>

			<label class="space-y-1 text-sm">
				<span class="text-surface-300">Summary</span>
				<textarea
					class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60 min-h-[80px]"
					bind:value={newDeck.summary}
				></textarea>
			</label>

			<label class="space-y-1 text-sm">
				<span class="text-surface-300">Deck link</span>
				<input
					class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
					type="url"
					placeholder="https://archidekt.com/decks/..."
					bind:value={newDeck.archidektLink}
				/>
			</label>

			{#if formError}
				<p class="text-xs text-error-300">{formError}</p>
			{/if}

			<div class="flex items-center gap-3">
				<button
					class="px-4 py-2 rounded-md bg-primary-500 text-white text-sm disabled:opacity-60"
					type="button"
					on:click={saveDeck}
					disabled={savingDeck}
				>
					{savingDeck ? 'Saving…' : 'Save deck'}
				</button>
			</div>
		</div>
	{/if}

	<!-- Error message -->
	{#if error}
		<div class="p-3 rounded-lg bg-error-500/20 text-error-300 text-sm border border-error-600/50">
			{error}
		</div>
	{/if}

	<!-- Deck previews -->
	{#if decks.length}
		<div
			class="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 justify-items-center"
		>
			{#each decks as deck}
				<CommanderPreview
					deckName={deck.deckName}
					summary={deck.summary}
					deckUrl={deck.archidektLink}
				/>
			{/each}
		</div>
	{:else}
		<p class="text-sm text-surface-400">No decks found in your database yet.</p>
	{/if}
</div>
