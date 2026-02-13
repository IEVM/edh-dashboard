<script lang="ts">
	// No logic needed for now
</script>

<header class="space-y-2">
	<h1 class="text-3xl font-semibold">How to use this EDH tracker</h1>
	<p class="text-surface-300 text-sm">
		Track Commander games without spreadsheets. Your data lives in Postgres and you manage it directly
		inside the app.
	</p>
</header>

<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">1) Sign in</h2>
	<p class="text-sm text-surface-200">
		Use the sign-in button in the top-right. You can use Google (via Supabase) and we only use it for
		identity. Your game data stays in the app database.
	</p>
</section>

<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">2) Add your decks</h2>
	<p class="text-sm text-surface-200">
		Go to the <a href="/decks" class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
			>Decks</a
		> page and add each deck with its name, bracket, summary, and optional deck link.
	</p>
</section>

<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">3) Log games</h2>
	<p class="text-sm text-surface-200">
		Open a deck and use the game form to record wins, fun scores, pod bracket, and notes. Each entry is
		a single game tied to that deck.
	</p>
</section>

<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">4) Analyze your stats</h2>
	<p class="text-sm text-surface-200">
		Visit the <a
			href="/dashboard"
			class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
			>Dashboard</a
		> to see win rates, usage, fun averages, and deck comparisons.
	</p>
</section>

<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">Why does this site ask for Google permissions?</h2>
	<p class="text-sm text-surface-200">
		If you choose Google sign-in, Supabase requests basic profile info (openid/email/profile) to identify
		your account. No access to Drive or Sheets is required.
	</p>
</section>
