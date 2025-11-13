<script lang="ts">
	let spreadsheetId = '';
	let values: string[][] = [];
	let errorMsg: string | null = null;

	function connectGoogle() {
		window.location.href = '/api/auth/google';
	}

	async function loadSheet() {
		errorMsg = null;
		values = [];

		if (!spreadsheetId) {
			errorMsg = 'Please paste a spreadsheet ID.';
			return;
		}

		const res = await fetch(
			`/api/sheets/read?spreadsheetId=${encodeURIComponent(spreadsheetId)}&range=Decks!A1:F20`
		);

		if (!res.ok) {
			errorMsg = `Failed to load sheet (HTTP ${res.status}). Are you logged in and is the sheet name/range correct?`;
			return;
		}

		const data = await res.json();
		values = data.values ?? [];
	}
</script>

<main class="p-6 space-y-4">
	<h1 class="text-2xl font-bold">EDH Dashboard - Multi-user demo</h1>

	<p class="text-sm">
		1) Click “Connect Google” to log in with your Google account.<br />
		2) Open any Google Sheet you own, copy the <strong>spreadsheet ID</strong> from the URL.<br />
		3) Paste it below and click “Load sheet”.
	</p>

	<button
		class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
		on:click={connectGoogle}
	>
		Connect Google
	</button>

	<div class="space-y-2 mt-4">
		<label class="text-sm">Spreadsheet ID</label>
		<p>19bfi3yZ-G-aqkfPTY6K9EFA83bkySxTyb1oSjugLuko</p>
		<input
			class="border border-gray-600 bg-gray-800 text-white px-2 py-1 rounded w-full max-w-md placeholder-gray-400"
			bind:value={spreadsheetId}
			placeholder="ID between /d/ and /edit"
		/>
		<button
			class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
			on:click={loadSheet}
		>
			Load Sheet
		</button>
	</div>

	{#if errorMsg}
		<p class="text-sm text-red-600 mt-2">{errorMsg}</p>
	{/if}

	{#if values.length}
		<table class="mt-4 border-collapse border">
			{#each values as row}
				<tr>
					{#each row as cell}
						<td class="border px-2 py-1 text-sm">{cell}</td>
					{/each}
				</tr>
			{/each}
		</table>
	{/if}
</main>
