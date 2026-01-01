<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  export let archidektUrl: string | null = null;
  export let summary: string | null = "";
  export let deckName: string = '';

  let deckId: string | null = null;
  let loading = false;
  let errorMsg: string | null = null;
  let archidektName = '';
  let image = '';
  let commanders: string[] = [];

  // Extract numeric deck ID from a typical Archidekt URL
  function extractDeckId(url: string | null): string | null {
    if (!url) return null;
    const match = url.match(/archidekt\.com\/decks\/(\d+)/);
    return match ? match[1] : null;
  }

  function extractCommanders(deck: any): string[] {
    if (!deck || !Array.isArray(deck.categories)) return [];

    // Heuristic: find category named like "Commander" (Archidekt EDH decks usually have this)
    const commanderCategory =
      deck.categories.find((c: any) =>
        typeof c.name === 'string' &&
        c.name.toLowerCase().includes('commander')
      ) ?? null;

    if (!commanderCategory || !Array.isArray(commanderCategory.cards)) return [];

    const names = commanderCategory.cards
      .map((entry: any) =>
        entry?.card?.oracleCard?.name ??
        entry?.card?.oracle_card?.name ??
        null
      )
      .filter((n: string | null): n is string => !!n);

    // Deduplicate just in case
    return Array.from(new Set(names));
  }

  async function loadDeck() {
    errorMsg = null;
    archidektName = '';
    commanders = [];

    deckId = extractDeckId(archidektUrl);

    if (!deckId) {
      errorMsg = 'Invalid or missing Archidekt link.';
      return;
    }

    loading = true;

    try {
      const res = await fetch(`/api/archidekt/${deckId}`);
      if (!res.ok) {
        errorMsg = `Failed to load deck (${res.status}).`;
        return;
      }

      const data = await res.json();
      archidektName = data.name ?? 'Untitled Deck';
      image = data.featured;
      commanders = extractCommanders(data);
    } catch (err) {
      console.error(err);
      errorMsg = 'Error while fetching deck data.';
    } finally {
      loading = false;
    }
  }

  // Initial load
  onMount(() => {
    if (archidektUrl) {
      loadDeck();
    }
  });

  // Reload when URL changes
  $: if (browser && archidektUrl) {
    // Don’t spam the API if the ID didn’t change
    const newId = extractDeckId(archidektUrl);
    if (newId && newId !== deckId) {
      loadDeck();
    }
  }
</script>

<div class="p-2 rounded-lg bg-surface-800 border border-surface-700/60 space-y-2 w-max">
  <!-- Deck title + link -->
  <div class="flex items-center justify-between gap-2">
    <div class="flex flex-col">
      <span class="font-semibold">
        {#if deckName}
          <a href="/dashboard/{encodeURIComponent(deckName)}">{deckName}</a>
        {:else if archidektUrl && archidektUrl != '-'}
          Archidekt Deck
        {:else}
          No deck linked
        {/if}
      </span>
      {#if archidektUrl && archidektUrl != '-'}
        <a href="/dashboard/{encodeURIComponent(deckName)}">
            <img src={image} alt={deckName}>
        </a>
        <a
          href={archidektUrl}
          target="_blank"
          rel="noreferrer"
          class="text-xs text-primary-300 hover:text-primary-200 underline underline-offset-2"
        >
          Open on Archidekt
        </a>
      {/if}
    </div>

    {#if loading}
      <span class="text-xs text-surface-400">Loading…</span>
    {/if}
  </div>

  <!-- Summary -->
  {#if summary}
    <p class="text-xs text-surface-300 text-left 
         max-w-[250px] break-words whitespace-normal">
      {summary}
    </p>
  {/if}

  {#if errorMsg}
    <p class="text-xs text-error-400">
      {errorMsg}
    </p>
  {/if}
</div>
