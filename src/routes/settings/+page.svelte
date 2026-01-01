<script lang="ts">
  // Data comes from +page.server.ts
  export let data: { spreadsheetId: string | null };

  // Currently linked spreadsheet id (as shown in the UI)
  let spreadsheetId = data.spreadsheetId ?? '';

  let spreadsheets: Array<{ id: string; name: string }> = [];
  let selectedId = '';
  let pastedLink = '';
  let loadingDrive = false;
  let creating = false;

  /**
   * Loads spreadsheets from the server (Google Drive) and populates the dropdown.
   */
  async function loadSheets() {
    loadingDrive = true;
    const res = await fetch('/api/drive/list-spreadsheets');
    spreadsheets = await res.json();
    loadingDrive = false;
  }

  /**
   * Creates an empty "EDH Deck Database" spreadsheet and selects it.
   */
  async function createSheet() {
    creating = true;
    const res = await fetch('/api/sheets/create', { method: 'POST' });
    const data = await res.json();
    selectedId = data.spreadsheetId;
    creating = false;
  }

  /**
   * Creates a demo spreadsheet (sample decks + many games) and selects it.
   */
  async function createSampleSheet() {
    creating = true;
    const res = await fetch('/api/sheets/create-sample', { method: 'POST' });
    const data = await res.json();
    selectedId = data.spreadsheetId;
    creating = false;
  }

  /**
   * Persists the chosen spreadsheet id in the server session.
   *
   * Priority:
   * - dropdown selection (`selectedId`)
   * - ID parsed from a pasted Google Sheets link
   */
  async function saveSelection() {
    let spreadsheetId = selectedId;

    if (!spreadsheetId && pastedLink.includes('/d/')) {
      spreadsheetId = pastedLink.split('/d/')[1].split('/')[0];
    }

    if (!spreadsheetId) {
      alert('Please choose or paste a spreadsheet ID.');
      return;
    }

    await fetch('/api/settings/set-database', {
      method: 'POST',
      body: JSON.stringify({ spreadsheetId })
    });

    alert('Database updated!');
  }
</script>

<div class="space-y-10 max-w-3xl mx-auto">
  <!-- Header -->
  <header class="space-y-2">
    <h1 class="text-3xl font-semibold">Settings</h1>
    <p class="text-surface-300 text-sm">Configure your EDH database and connected Google Sheets.</p>
  </header>

  <!-- Display current -->
  <section class="space-y-4 p-6 rounded-xl bg-surface-800 border border-surface-700/40">
    {#if spreadsheetId}
      <p>
        You have
        <a
          href="https://docs.google.com/spreadsheets/d/{spreadsheetId}"
          target="_blank"
          rel="noreferrer"
          class="text-primary-300 hover:text-primary-200 underline underline-offset-2 ml-1"
        >
          {spreadsheetId}
        </a>
        currently linked as the database.
      </p>
    {:else}
      <p>You have not yet linked a database.</p>
    {/if}
  </section>

  <!-- Choose existing -->
  <section class="space-y-4 p-6 rounded-xl bg-surface-800 border border-surface-700/40">
    <h2 class="text-xl font-semibold">Choose Existing Spreadsheet</h2>

    <button class="btn variant-filled-primary-500" on:click={loadSheets} disabled={loadingDrive}>
      {loadingDrive ? 'Loading…' : 'Load My Spreadsheets'}
    </button>

    {#if spreadsheets.length}
      <select bind:value={selectedId} class="input variant-outlined-primary-500 w-full mt-4">
        <option value="">Select a spreadsheet</option>
        {#each spreadsheets as s}
          <option value={s.id}>{s.name}</option>
        {/each}
      </select>
    {/if}
  </section>

  <!-- Paste link -->
  <section class="space-y-4 p-6 rounded-xl bg-surface-800 border border-surface-700/40">
    <h2 class="text-xl font-semibold">Paste Spreadsheet Link</h2>

    <input
      bind:value={pastedLink}
      placeholder="https://docs.google.com/spreadsheets/d/..."
      class="input variant-outlined-primary-500 w-full"
    />
  </section>

  <!-- Create new -->
  <section class="space-y-4 p-6 rounded-xl bg-surface-800 border border-surface-700/40">
    <h2 class="text-xl font-semibold">Create New Spreadsheet</h2>

    <div class="flex flex-col sm:flex-row gap-3">
      <button class="btn variant-filled-primary-500" on:click={createSheet} disabled={creating}>
        {creating ? 'Working…' : 'Create empty EDH database'}
      </button>

      <button class="btn variant-outlined-primary-500" on:click={createSampleSheet} disabled={creating}>
        {creating ? 'Working…' : 'Create demo database (my decks + 5000 games)'}
      </button>
    </div>

    {#if selectedId}
      <p class="text-sm text-surface-300 mt-2">
        Created:
        <a
          href={`https://docs.google.com/spreadsheets/d/${selectedId}`}
          target="_blank"
          rel="noreferrer"
          class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
        >
          {selectedId}
        </a>
      </p>
    {/if}
  </section>

  <!-- Save -->
  <div class="flex justify-end">
    <button class="btn variant-filled-primary-500 px-6 py-2" on:click={saveSelection}>
      Save Settings
    </button>
  </div>
</div>
