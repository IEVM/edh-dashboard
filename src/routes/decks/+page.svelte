<script lang="ts">
  import CommanderPreview from '$lib/components/CommanderPreview.svelte';
  import type { Deck } from '$lib/data/restructure';

  export let data: {
    error?: string;
    decks: Deck[];
  };

  // Destructure for simpler markup.
  const { error, decks } = data;
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-end justify-between">
    <h1 class="text-3xl font-semibold">Your Decks</h1>
  </div>

  <!-- Error message -->
  {#if error}
    <div class="p-3 rounded-lg bg-error-500/20 text-error-300 text-sm border border-error-600/50">
      {error}
    </div>
  {/if}

  <!-- Deck previews -->
  {#if decks.length}
    <div class="flex gap-4 flex-wrap">
      {#each decks as deck}
        <CommanderPreview
          deckName={deck.deckName}
          summary={deck.summary}
          archidektUrl={deck.archidektLink}
        />
      {/each}
    </div>
  {:else}
    <p class="text-sm text-surface-400">No decks found in your database yet.</p>
  {/if}
</div>
