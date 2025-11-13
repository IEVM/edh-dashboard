<script lang="ts">
  // Local state
  let spreadsheetId = '';
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
      errorMsg = 'Unexpected error. Check console.';
      console.error(e);
    } finally {
      loading = false;
    }
  }
</script>

<div class="space-y-8">

  <!-- HEADER -->
  <div class="flex items-end justify-between">
    <h1 class="text-3xl font-semibold">Your Decks</h1>
  </div>

  <!-- INPUT + BUTTON -->
  <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-end">

    <!-- Input -->
    <div class="flex flex-col w-full max-w-md">
      <label class="text-sm text-surface-300 mb-1">Google Spreadsheet ID</label>
      <input
        type="text"
        bind:value={spreadsheetId}
        placeholder="Paste your spreadsheet ID here"
        class="input variant-outlined-primary-500 w-full"
      />
      <p class="text-xs text-surface-400 mt-1">
        Example from a URL: https://docs.google.com/spreadsheets/d/<strong>ID</strong>/edit
      </p>
    </div>

    <!-- Load button -->
    <button
      on:click={loadSheet}
      class="btn variant-filled-primary-500 px-6 py-2 text-sm font-medium"
      disabled={loading}
    >
      {loading ? 'Loading…' : 'Load Decks'}
    </button>
  </div>

  <!-- ERROR MESSAGE -->
  {#if errorMsg}
    <div class="p-3 rounded-lg bg-error-500/20 text-error-300 text-sm border border-error-600/50">
      {errorMsg}
    </div>
  {/if}

  <!-- DECK TABLE -->
  {#if values.length}
    <div class="rounded-lg overflow-hidden border border-surface-700/40 shadow-lg shadow-black/20">
      <table class="w-full text-sm">
        <thead class="bg-surface-800 text-surface-200 border-b border-surface-700/30">
          <tr>
            {#each values[0] as col}
              <th class="py-3 px-4 text-left font-semibold">
                {col}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each values.slice(1) as row}
            <tr class="bg-surface-900 hover:bg-surface-800/40 transition-colors border-b border-surface-700/20">
              {#each row as cell}
                <td class="px-4 py-2">
                  {cell}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <p class="text-surface-400 text-sm italic">
      No deck data loaded yet.
    </p>
  {/if}
</div>
