<script lang="ts">
	import { browser } from '$app/environment';
	import { loadDeckData } from '$lib/deck-links/load';
	import { parseUrl } from '$lib/deck-links/parse';
	import type { ParsedDeckLink } from '$lib/deck-links/types';

	export let deckUrl: string | null = null;
	export let summary: string | null = null;
	export let deckName: string = '';

	let loading = false;
	let fetchError: string | null = null;
	let remoteName = '';
	let image = '';
	let lastLoadedKey: string | null = null;
	let link: ParsedDeckLink = {
		url: null,
		provider: null,
		id: null,
		label: null,
		error: null
	};

	function resetDeckState() {
		loading = false;
		fetchError = null;
		remoteName = '';
		image = '';
		lastLoadedKey = null;
	}

	async function loadDeck(parsed: ParsedDeckLink) {
		fetchError = null;
		remoteName = '';
		image = '';
		loading = true;

		try {
			const data = await loadDeckData(parsed);
			remoteName = data.name;
			image = data.image;
		} catch (err) {
			console.error(err);
			fetchError = 'Error while fetching deck data.';
		} finally {
			loading = false;
		}
	}

	$: link = parseUrl(deckUrl);

	$: if (!link.url || link.error) {
		resetDeckState();
	}

	// Reload when URL changes (client-only guard)
	$: if (browser && link.provider && link.id) {
		const key = `${link.provider}:${link.id}`;
		if (key !== lastLoadedKey) {
			lastLoadedKey = key;
			loadDeck(link);
		}
	}
</script>

<div
	class="p-2 rounded-lg bg-surface-800 border border-surface-700/60 space-y-2 w-full max-w-[18rem]"
>
	<!-- Deck title + link -->
	<div class="flex items-center justify-between gap-2">
		<div class="flex flex-col">
			<span class="font-semibold">
				{#if deckName}
					<a href="/dashboard/{encodeURIComponent(deckName)}">{deckName}</a>
				{:else if remoteName}
					{remoteName}
				{:else if link.label}
					{link.label} Deck
				{:else}
					Untitled Deck
				{/if}
			</span>

			{#if image}
				<a href="/dashboard/{encodeURIComponent(deckName || remoteName)}">
					<img
						src={image}
						alt={deckName || remoteName}
						class="w-full aspect-[3/2] object-cover rounded-md border border-surface-700/60"
					/>
				</a>
			{:else if link.error || fetchError || !link.url}
				<div
					class="w-full aspect-[3/2] rounded-md border border-surface-700/60 bg-surface-900/40 flex items-center justify-center text-xs text-center px-3 {link.error ||
					fetchError
						? 'text-error-400'
						: 'text-surface-400'}"
				>
					{link.error ?? fetchError ?? 'No deck link.'}
				</div>
			{/if}

			{#if link.url && !link.error}
				<a
					href={link.url}
					target="_blank"
					rel="noreferrer"
					class="text-xs text-primary-300 hover:text-primary-200 underline underline-offset-2"
				>
					Open on {link.label}
				</a>
			{/if}
		</div>

		{#if loading}
			<span class="text-xs text-surface-400">Loading…</span>
		{/if}
	</div>

	<!-- Summary -->
	{#if summary}
		<p
			class="text-xs text-surface-300 text-left max-w-full sm:max-w-[250px] break-words whitespace-normal"
		>
			{summary}
		</p>
	{/if}
</div>
