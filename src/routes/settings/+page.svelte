<script lang="ts">
	// comes from +page.server.ts
	export let data: { spreadsheetId: string | null };

	let spreadsheetId = data.spreadsheetId ?? '';

	let spreadsheets: Array<{ id: string; name: string }> = [];
	let selectedId = '';
	let pastedLink = '';
	let loadingDrive = false;
	let creating = false;

	async function loadSheets() {
		loadingDrive = true;
		const res = await fetch('/api/drive/list-spreadsheets');
		spreadsheets = await res.json();
		loadingDrive = false;
	}

	async function createSheet() {
		creating = true;
		const res = await fetch('/api/sheets/create', { method: 'POST' });
		const data = await res.json();
		selectedId = data.spreadsheetId;
		creating = false;
	}

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
	<!-- HEADER -->
	<header class="space-y-2">
		<h1 class="text-3xl font-semibold">Settings</h1>
		<p class="text-surface-300 text-sm">Configure your EDH database and connected Google Sheets.</p>
	</header>

	<!-- DISPLAY CURRENT -->

	<section class="space-y-4 p-6 rounded-xl bg-surface-800 border border-surface-700/40">
		{#if spreadsheetId}
			<p>
				You have
				<a
					href="https://docs.google.com/spreadsheets/d/{spreadsheetId}"
					target="_blank"
					rel="noreferrer"
					class="text-primary-300 hover:text-primary-200 underline underline-offset-2 ml-1"
					>{spreadsheetId}</a
				>
				currently linked as the database.
			</p>
    {:else}
      <p>You have not yet linked a database.</p>
		{/if}
	</section>

	<!-- CHOOSE EXISTING -->
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

	<!-- PASTE LINK -->
	<section class="space-y-4 p-6 rounded-xl bg-surface-800 border border-surface-700/40">
		<h2 class="text-xl font-semibold">Paste Spreadsheet Link</h2>

		<input
			bind:value={pastedLink}
			placeholder="https://docs.google.com/spreadsheets/d/..."
			class="input variant-outlined-primary-500 w-full"
		/>
	</section>

	<!-- CREATE NEW -->
	<section class="space-y-4 p-6 rounded-xl bg-surface-800 border border-surface-700/40">
		<h2 class="text-xl font-semibold">Create New Spreadsheet</h2>

		<button class="btn variant-filled-primary-500" on:click={createSheet} disabled={creating}>
			{creating ? 'Creating…' : 'Create EDH Database'}
		</button>

		{#if selectedId}
			<p class="text-sm text-primary-300 mt-2">
				Created: <span class="font-mono">{selectedId}</span>
			</p>
		{/if}
	</section>

	<!-- SAVE -->
	<div class="flex justify-end">
		<button class="btn variant-filled-primary-500 px-6 py-2" on:click={saveSelection}>
			Save Settings
		</button>
	</div>
</div>
