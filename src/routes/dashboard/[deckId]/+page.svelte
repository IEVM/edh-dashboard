<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import CommanderPreview from '$lib/components/CommanderPreview.svelte';
	import WRBar from '$lib/components/WRBar.svelte';
	import type { Deck } from '$lib/data/restructure';

	export let data: {
		deck: Deck | null;
		error?: string;
	};

	// Destructure for easier template usage.
	const { deck, error } = data;

	/**
	 * Formats a nullable number. Returns "-" if null/undefined/NaN.
	 *
	 * @param value  Number to format
	 * @param digits Number of decimal places (default 1)
	 */
	function fmtNum(value: number | null | undefined, digits = 1): string {
		if (value == null || Number.isNaN(value)) return '-';
		return value.toFixed(digits);
	}

	/**
	 * Formats a percentage value in 0–100 with a % sign.
	 *
	 */
	function fmtPct(percent: number | null | undefined, digits = 1): string {
		if (percent == null || Number.isNaN(percent)) return '-';
		return `${(100 * percent).toFixed(digits)}%`;
	}

	/**
	 * Human-readable label for a winner flag.
	 *
	 * Current assumption:
	 * - 1 => "Win"
	 * - 2, 3, 4 => "Loss"
	 * - null/other => "–"
	 *
	 */
	function resultLabel(winner: number | null | undefined): string {
		if (!winner) return '-';
		if (winner === 1) return 'Win';
		if (winner >= 2 && winner <= 4) return 'Loss';
		return '-';
	}

	/**
	 * CSS class to color the result text.
	 */
	function resultClass(winner: number | null | undefined): string {
		if (!winner) return 'text-surface-300';
		if (winner === 1) return 'text-success-400';
		if (winner >= 2 && winner <= 4) return 'text-error-400';
		return 'text-surface-300';
	}

	/**
	 * Computes the average "fun" score of other players (p2–p4) for a single game.
	 *
	 * @returns "–" if there are no values
	 */
	function avgFunOthers(
		game: { p2Fun: number | null; p3Fun: number | null; p4Fun: number | null },
		digits = 1
	): string {
		const values = [game.p2Fun, game.p3Fun, game.p4Fun].filter((v): v is number => v != null);

		if (!values.length) return '–';

		const sum = values.reduce((a, b) => a + b, 0);
		return (sum / values.length).toFixed(digits);
	}

	function deckLinkLabel(url: string | null | undefined): string {
		if (!url) return 'Deck';
		const normalized = url.toLowerCase();
		if (normalized.includes('moxfield.com')) return 'Moxfield';
		if (normalized.includes('archidekt.com')) return 'Archidekt';
		return 'Deck';
	}

	$: funDiff =
		deck?.stats && deck.stats.avgFunSelf != null && deck.stats.avgFunOthers != null
			? deck.stats.avgFunSelf - deck.stats.avgFunOthers
			: null;

	function fmtDiff(value: number | null | undefined, digits = 1): string {
		if (value == null || Number.isNaN(value)) return '-';
		const sign = value > 0 ? '+' : '';
		return `${sign}${value.toFixed(digits)}`;
	}

	const toNumberOrNull = (value: string): number | null => {
		const trimmed = value.trim();
		if (!trimmed) return null;
		const n = Number(trimmed);
		return Number.isNaN(n) ? null : n;
	};

	let editingDeck = false;
	let savingDeck = false;
	let deckFormError = '';
	let deckOriginalName = '';
	let deleteConfirm = '';
	let deletingDeck = false;

	let deckForm = {
		deckName: '',
		targetBracket: '',
		summary: '',
		archidektLink: ''
	};

	const resetDeckForm = () => {
		deckForm = {
			deckName: deck?.deckName ?? '',
			targetBracket: deck?.targetBracket?.toString() ?? '',
			summary: deck?.summary ?? '',
			archidektLink: deck?.archidektLink ?? ''
		};
	};

	$: if (deck && !editingDeck) {
		deckOriginalName = deck.deckName;
		resetDeckForm();
	}

	const startEditDeck = () => {
		if (!deck) return;
		editingDeck = true;
		deckOriginalName = deck.deckName;
		resetDeckForm();
	};

	const cancelEditDeck = () => {
		editingDeck = false;
		deckFormError = '';
		resetDeckForm();
	};

	const saveDeck = async () => {
		if (!deck || !deck.id) return;
		deckFormError = '';

		if (!deckForm.deckName.trim()) {
			deckFormError = 'Deck name is required.';
			return;
		}

		savingDeck = true;
		try {
			const res = await fetch('/api/decks/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					deckId: deck.id,
					originalName: deckOriginalName,
					deckName: deckForm.deckName.trim(),
					targetBracket: toNumberOrNull(deckForm.targetBracket),
					summary: deckForm.summary.trim() || null,
					archidektLink: deckForm.archidektLink.trim() || null
				})
			});

			if (!res.ok) {
				deckFormError = await res.text();
				return;
			}

			editingDeck = false;
			await invalidateAll();
		} finally {
			savingDeck = false;
		}
	};

	const deleteDeck = async () => {
		if (!deck || !deck.id) return;
		if (deleteConfirm.trim() !== deck.deckName) {
			deckFormError = 'Please type the deck name to confirm deletion.';
			return;
		}

		deletingDeck = true;
		deckFormError = '';
		try {
			const res = await fetch('/api/decks/delete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					deckId: deck.id,
					deckName: deck.deckName
				})
			});

			if (!res.ok) {
				deckFormError = await res.text();
				return;
			}

			await goto('/decks');
		} finally {
			deletingDeck = false;
		}
	};

	let addingGame = false;
	let savingGame = false;
	let gameError = '';
	let newGame = {
		winner: '',
		fun: '',
		p2Fun: '',
		p3Fun: '',
		p4Fun: '',
		notes: '',
		estBracket: ''
	};

	let editingGameId: string | null = null;
	let editingGame = {
		winner: '',
		fun: '',
		p2Fun: '',
		p3Fun: '',
		p4Fun: '',
		notes: '',
		estBracket: ''
	};

	const resetNewGame = () => {
		newGame = {
			winner: '',
			fun: '',
			p2Fun: '',
			p3Fun: '',
			p4Fun: '',
			notes: '',
			estBracket: ''
		};
	};

	const startEditGame = (game: {
		id?: string;
		winner: number | null;
		fun: number | null;
		p2Fun: number | null;
		p3Fun: number | null;
		p4Fun: number | null;
		notes: string | null;
		estBracket: number | null;
	}) => {
		if (!game.id) return;
		editingGameId = game.id;
		editingGame = {
			winner: game.winner?.toString() ?? '',
			fun: game.fun?.toString() ?? '',
			p2Fun: game.p2Fun?.toString() ?? '',
			p3Fun: game.p3Fun?.toString() ?? '',
			p4Fun: game.p4Fun?.toString() ?? '',
			notes: game.notes ?? '',
			estBracket: game.estBracket?.toString() ?? ''
		};
		gameError = '';
	};

	const cancelEditGame = () => {
		editingGameId = null;
		gameError = '';
	};

	const saveGame = async (gameId: string) => {
		if (!deck) return;
		savingGame = true;
		gameError = '';

		try {
			const res = await fetch('/api/games/update', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					gameId,
					deckName: deck.deckName,
					winner: toNumberOrNull(editingGame.winner),
					fun: toNumberOrNull(editingGame.fun),
					p2Fun: toNumberOrNull(editingGame.p2Fun),
					p3Fun: toNumberOrNull(editingGame.p3Fun),
					p4Fun: toNumberOrNull(editingGame.p4Fun),
					notes: editingGame.notes.trim() || null,
					estBracket: toNumberOrNull(editingGame.estBracket)
				})
			});

			if (!res.ok) {
				gameError = await res.text();
				return;
			}

			editingGameId = null;
			await invalidateAll();
		} finally {
			savingGame = false;
		}
	};

	const deleteGame = async (gameId?: string) => {
		if (!gameId) return;
		if (!confirm('Delete this game? This cannot be undone.')) return;

		gameError = '';
		const res = await fetch('/api/games/delete', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				gameId
			})
		});

		if (!res.ok) {
			gameError = await res.text();
			return;
		}

		await invalidateAll();
	};

	const addGame = async () => {
		if (!deck) return;
		savingGame = true;
		gameError = '';

		try {
			const res = await fetch('/api/games/append', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					deckName: deck.deckName,
					winner: toNumberOrNull(newGame.winner),
					fun: toNumberOrNull(newGame.fun),
					p2Fun: toNumberOrNull(newGame.p2Fun),
					p3Fun: toNumberOrNull(newGame.p3Fun),
					p4Fun: toNumberOrNull(newGame.p4Fun),
					notes: newGame.notes.trim() || null,
					estBracket: toNumberOrNull(newGame.estBracket)
				})
			});

			if (!res.ok) {
				gameError = await res.text();
				return;
			}

			resetNewGame();
			addingGame = false;
			await invalidateAll();
		} finally {
			savingGame = false;
		}
	};
</script>

<div class="space-y-6">
	{#if error}
		<h1 class="text-3xl font-semibold">An error occured</h1>
		<p class="text-sm text-surface-300 max-w-xl">error</p>
	{:else if !deck}
		<h1 class="text-3xl font-semibold">Missing Deck</h1>
		<p class="text-sm text-surface-300 max-w-xl">
			There seems to not be a deck with the specified id in your database.
		</p>
	{:else}
		<!-- Header -->
		<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
			<div class="space-y-3">
				{#if editingDeck}
					<div class="space-y-3">
						<div class="grid gap-3 sm:grid-cols-2">
							<label class="space-y-1 text-sm">
								<span class="text-surface-300">Name</span>
								<input
									class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
									type="text"
									bind:value={deckForm.deckName}
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
									bind:value={deckForm.targetBracket}
								/>
							</label>
						</div>

						<label class="space-y-1 text-sm">
							<span class="text-surface-300">Summary</span>
							<textarea
								class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60 min-h-[80px]"
								bind:value={deckForm.summary}
							></textarea>
						</label>

						<label class="space-y-1 text-sm">
							<span class="text-surface-300">Deck link</span>
							<input
								class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
								type="url"
								placeholder="https://archidekt.com/decks/..."
								bind:value={deckForm.archidektLink}
							/>
						</label>

						{#if deckFormError}
							<p class="text-xs text-error-300">{deckFormError}</p>
						{/if}

						<div class="flex flex-wrap items-center gap-3">
							<button
								class="px-4 py-2 rounded-md bg-primary-500 text-white text-sm disabled:opacity-60"
								type="button"
								on:click={saveDeck}
								disabled={savingDeck}
							>
								{savingDeck ? 'Saving…' : 'Save'}
							</button>
							<button
								class="px-4 py-2 rounded-md bg-surface-800 text-surface-200 text-sm border border-surface-700/60"
								type="button"
								on:click={cancelEditDeck}
								disabled={savingDeck}
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<h1 class="text-3xl font-semibold">{deck.deckName}</h1>

					{#if deck.summary}
						<p class="text-sm text-surface-300 max-w-xl">
							{deck.summary}
						</p>
					{/if}

					<div class="flex flex-wrap items-center gap-3 text-xs text-surface-400">
						{#if deck.targetBracket !== null}
							<span>
								Target bracket:
								<strong class="text-surface-100">{deck.targetBracket}</strong>
							</span>
						{/if}

						{#if deck.archidektLink && deck.archidektLink !== '-'}
							<a
								href={deck.archidektLink}
								target="_blank"
								rel="noreferrer"
								class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
							>
								View on {deckLinkLabel(deck.archidektLink)}
							</a>
						{/if}
					</div>

					<div class="flex flex-wrap items-center gap-3">
						<button
							class="px-3 py-1 rounded-md bg-surface-800 text-surface-200 text-sm border border-surface-700/60"
							type="button"
							on:click={startEditDeck}
						>
							Edit deck
						</button>
					</div>
				{/if}

				{#if !editingDeck}
					<div class="p-3 rounded-lg bg-surface-900/60 border border-surface-700/60 space-y-2">
						<div class="text-xs uppercase tracking-wide text-surface-400">Delete deck</div>
						<p class="text-xs text-surface-400">
							Type the deck name to confirm. This will also delete all games for this deck.
						</p>
						<input
							class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60 text-sm"
							type="text"
							placeholder={deck.deckName}
							bind:value={deleteConfirm}
						/>
						<button
							class="px-3 py-1 rounded-md bg-error-500/20 text-error-300 text-sm border border-error-500/40 disabled:opacity-60"
							type="button"
							on:click={deleteDeck}
							disabled={deletingDeck}
						>
							{deletingDeck ? 'Deleting…' : 'Delete deck'}
						</button>
						{#if deckFormError}
							<p class="text-xs text-error-300">{deckFormError}</p>
						{/if}
					</div>
				{/if}
			</div>

			<CommanderPreview
				deckId={deck.id ?? null}
				deckName={deck.deckName}
				deckUrl={deck.archidektLink}
				summary={deck.summary ?? ''}
			/>
		</div>

		<!-- Quick stats -->
		{#if deck.stats}
			<div class="grid gap-4 md:grid-cols-3">
				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
					<div class="text-xs uppercase tracking-wide text-surface-400">Games played</div>
					<div class="text-2xl font-semibold">
						{deck.stats.totalGames}
					</div>
				</div>

				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
					<div class="text-xs uppercase tracking-wide text-surface-400">Record</div>
					<div class="text-lg font-semibold">
						{deck.stats.wins} - {deck.stats.losses}
					</div>
					<div class="text-xs text-surface-400">
						{fmtPct(deck.stats.winRate)}
					</div>
				</div>

				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-1">
					<div class="text-xs uppercase tracking-wide text-surface-400">Avg fun (you)</div>
					<div class="text-lg font-semibold">
						{fmtNum(deck.stats.avgFunSelf)}
					</div>
					<div class="text-xs text-surface-400">
						Std dev: {fmtNum(deck.stats.stdFunSelf, 2)}
					</div>
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-3">
				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-2">
					<div class="text-xs uppercase tracking-wide text-surface-400">Avg est. pod bracket</div>
					<div class="text-lg font-semibold">
						{fmtNum(deck.stats.avgEstBracket)}
					</div>
				</div>

				<div class="p-4 rounded-xl bg-surface-800 border border-surface-700/60 space-y-2">
					<div class="text-xs uppercase tracking-wide text-surface-400">Fun vs others</div>
					<div class="grid grid-cols-2 gap-3 text-sm">
						<div>
							<div class="text-xs text-surface-400">You</div>
							<div class="text-lg font-semibold">{fmtNum(deck.stats.avgFunSelf)}</div>
						</div>
						<div>
							<div class="text-xs text-surface-400">Others</div>
							<div class="text-lg font-semibold">{fmtNum(deck.stats.avgFunOthers)}</div>
						</div>
					</div>
					<div class="text-xs text-surface-400">Diff: {fmtDiff(funDiff)}</div>
				</div>

				<WRBar winRate={deck.stats.winRate} expectedWinrate={deck.stats.expectedWinrate}></WRBar>
			</div>
		{:else}
			<p class="text-sm text-surface-400">No games logged yet for this deck.</p>
		{/if}

		<!-- Games -->
		{#if !deck.games}
			<p class="text-sm text-surface-400">
				There have been no games in your database with this deck.
			</p>
		{:else}
			<div class="space-y-3">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<h2 class="text-lg font-semibold">Games</h2>
					<div class="flex items-center gap-3">
						<p class="text-xs text-surface-400">
							Showing {deck.games.length} game{deck.games.length === 1 ? '' : 's'} for this deck.
						</p>
						<button
							class="px-3 py-1 rounded-md bg-primary-500/20 text-primary-200 text-xs border border-primary-500/40"
							type="button"
							on:click={() => (addingGame = !addingGame)}
						>
							{addingGame ? 'Cancel' : 'Add game'}
						</button>
					</div>
				</div>

				{#if addingGame}
					<div class="p-3 rounded-xl bg-surface-900/60 border border-surface-700/60 space-y-3">
						<div class="text-xs text-surface-400">Deck</div>
						<select
							class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60 text-sm"
							disabled
						>
							<option>{deck.deckName}</option>
						</select>

						<div class="grid gap-3 sm:grid-cols-3">
							<label class="space-y-1 text-xs">
								<span class="text-surface-400">Winner (1-4)</span>
								<input
									class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
									type="number"
									min="1"
									max="4"
									step="1"
									bind:value={newGame.winner}
								/>
							</label>

							<label class="space-y-1 text-xs">
								<span class="text-surface-400">Fun (you)</span>
								<input
									class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
									type="number"
									min="1"
									max="5"
									step="0.1"
									bind:value={newGame.fun}
								/>
							</label>

							<label class="space-y-1 text-xs">
								<span class="text-surface-400">Est. bracket</span>
								<input
									class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
									type="number"
									min="1"
									max="5"
									step="0.1"
									bind:value={newGame.estBracket}
								/>
							</label>
						</div>

						<div class="grid gap-3 sm:grid-cols-3">
							<label class="space-y-1 text-xs">
								<span class="text-surface-400">P2 Fun</span>
								<input
									class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
									type="number"
									min="1"
									max="5"
									step="0.1"
									bind:value={newGame.p2Fun}
								/>
							</label>

							<label class="space-y-1 text-xs">
								<span class="text-surface-400">P3 Fun</span>
								<input
									class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
									type="number"
									min="1"
									max="5"
									step="0.1"
									bind:value={newGame.p3Fun}
								/>
							</label>

							<label class="space-y-1 text-xs">
								<span class="text-surface-400">P4 Fun</span>
								<input
									class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60"
									type="number"
									min="1"
									max="5"
									step="0.1"
									bind:value={newGame.p4Fun}
								/>
							</label>
						</div>

						<label class="space-y-1 text-xs">
							<span class="text-surface-400">Notes</span>
							<textarea
								class="w-full px-3 py-2 rounded-md bg-surface-900 border border-surface-700/60 min-h-[70px]"
								bind:value={newGame.notes}
							></textarea>
						</label>

						{#if gameError}
							<p class="text-xs text-error-300">{gameError}</p>
						{/if}

						<div class="flex items-center gap-3">
							<button
								class="px-3 py-1 rounded-md bg-primary-500 text-white text-xs disabled:opacity-60"
								type="button"
								on:click={addGame}
								disabled={savingGame}
							>
								{savingGame ? 'Saving…' : 'Save game'}
							</button>
						</div>
					</div>
				{/if}

				{#if deck.games.length}
					<div class="overflow-x-auto rounded-xl border border-surface-700/60 bg-surface-900/40">
						<table class="min-w-full text-sm">
							<thead class="text-xs text-surface-400 bg-surface-900 border-b border-surface-700/60">
								<tr>
									<th class="px-3 py-2 text-left">#</th>
									<th class="px-3 py-2 text-left">Result</th>
									<th class="px-3 py-2 text-right">Fun (you)</th>
									<th class="px-3 py-2 text-right">Fun (others)</th>
									<th class="px-3 py-2 text-right">Est. bracket</th>
									<th class="px-3 py-2 text-left">Notes</th>
									<th class="px-3 py-2 text-right">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each deck.games as g, i}
									{#if editingGameId === g.id}
										<tr class="border-t border-surface-800/60">
											<td class="px-3 py-2 text-xs text-surface-400">{i + 1}</td>
											<td class="px-3 py-2 text-xs">
												<input
													class="w-16 px-2 py-1 rounded-md bg-surface-900 border border-surface-700/60"
													type="number"
													min="1"
													max="4"
													step="1"
													bind:value={editingGame.winner}
												/>
											</td>
											<td class="px-3 py-2 text-right">
												<input
													class="w-16 px-2 py-1 rounded-md bg-surface-900 border border-surface-700/60 text-right"
													type="number"
													min="1"
													max="5"
													step="0.1"
													bind:value={editingGame.fun}
												/>
											</td>
											<td class="px-3 py-2 text-right">
												<div class="flex gap-2 justify-end">
													<input
														class="w-12 px-2 py-1 rounded-md bg-surface-900 border border-surface-700/60 text-right"
														type="number"
														min="1"
														max="5"
														step="0.1"
														placeholder="P2"
														bind:value={editingGame.p2Fun}
													/>
													<input
														class="w-12 px-2 py-1 rounded-md bg-surface-900 border border-surface-700/60 text-right"
														type="number"
														min="1"
														max="5"
														step="0.1"
														placeholder="P3"
														bind:value={editingGame.p3Fun}
													/>
													<input
														class="w-12 px-2 py-1 rounded-md bg-surface-900 border border-surface-700/60 text-right"
														type="number"
														min="1"
														max="5"
														step="0.1"
														placeholder="P4"
														bind:value={editingGame.p4Fun}
													/>
												</div>
											</td>
											<td class="px-3 py-2 text-right">
												<input
													class="w-16 px-2 py-1 rounded-md bg-surface-900 border border-surface-700/60 text-right"
													type="number"
													min="1"
													max="5"
													step="0.1"
													bind:value={editingGame.estBracket}
												/>
											</td>
											<td class="px-3 py-2 text-xs text-surface-300 max-w-xs">
												<input
													class="w-full px-2 py-1 rounded-md bg-surface-900 border border-surface-700/60"
													type="text"
													bind:value={editingGame.notes}
												/>
											</td>
											<td class="px-3 py-2 text-right">
												<div class="flex items-center justify-end gap-2">
													<button
														class="text-xs text-primary-300 hover:text-primary-200"
														type="button"
														on:click={() => g.id && saveGame(g.id)}
														disabled={savingGame}
													>
														Save
													</button>
													<button
														class="text-xs text-surface-400 hover:text-surface-200"
														type="button"
														on:click={cancelEditGame}
														disabled={savingGame}
													>
														Cancel
													</button>
												</div>
											</td>
										</tr>
									{:else}
										<tr class="border-t border-surface-800/60">
											<td class="px-3 py-2 text-xs text-surface-400">
												{i + 1}
											</td>
											<td class={`px-3 py-2 text-xs font-medium ${resultClass(g.winner)}`}>
												{resultLabel(g.winner)}
											</td>
											<td class="px-3 py-2 text-right text-surface-100">
												{g.fun == null ? '-' : g.fun.toFixed(1)}
											</td>
											<td class="px-3 py-2 text-right text-surface-100">
												{avgFunOthers(g)}
											</td>
											<td class="px-3 py-2 text-right text-surface-100">
												{g.estBracket == null ? '-' : g.estBracket.toFixed(1)}
											</td>
											<td class="px-3 py-2 text-xs text-surface-300 max-w-xs truncate">
												{g.notes ?? ''}
											</td>
											<td class="px-3 py-2 text-right">
												<div class="flex items-center justify-end gap-2">
													<button
														class="text-xs text-primary-300 hover:text-primary-200"
														type="button"
														on:click={() => startEditGame(g)}
														disabled={!g.id}
													>
														Edit
													</button>
													<button
														class="text-xs text-error-300 hover:text-error-200"
														type="button"
														on:click={() => deleteGame(g.id)}
														disabled={!g.id}
													>
														Delete
													</button>
												</div>
											</td>
										</tr>
									{/if}
								{/each}
							</tbody>
						</table>
					</div>
					{#if gameError}
						<p class="text-xs text-error-300">{gameError}</p>
					{/if}
				{:else}
					<p class="text-sm text-surface-400">No games logged yet for this deck.</p>
				{/if}
			</div>
		{/if}

		<div class="pt-4">
			<a
				href="/dashboard"
				class="text-sm text-primary-300 hover:text-primary-200 underline underline-offset-2"
			>
				← Back to overall dashboard
			</a>
		</div>
	{/if}
</div>
