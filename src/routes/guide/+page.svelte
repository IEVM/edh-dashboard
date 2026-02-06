<script lang="ts">
	// No logic needed for now
</script>

<header class="space-y-2">
	<h1 class="text-3xl font-semibold">How to use this EDH tracker</h1>
	<p class="text-surface-300 text-sm">
		This site helps you track your Commander games using your own Google Sheets as a database.
		Here is how to set it up and why it needs certain permissions.
	</p>
</header>

<!-- Step 0 -->
<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">0) Link your Google account</h2>
	<p class="text-sm text-surface-200">
		First, sign in with Google using the button in the top-right corner. This is required so the
		site can read and update your EDH data stored in your own Google Sheets. There is no separate
		account system on this site. Your Google account is your identity.
	</p>
</section>

<!-- Step 1 -->
<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">1) Generate or choose a database</h2>
	<p class="text-sm text-surface-200">
		Go to the <a
			href="/settings"
			class="text-primary-300 hover:text-primary-200 underline underline-offset-2">Settings</a
		> page. There you can create a new EDH database spreadsheet, select one of your existing spreadsheets,
		or paste a link to a spreadsheet you have already set up. This spreadsheet becomes your personal
		EDH data hub. All game and deck information will be stored there.
	</p>
</section>

<!-- Step 2 -->
<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">2) Enter your decks</h2>
	<p class="text-sm text-surface-200">
		In your database spreadsheet, use the deck sheet (for example a tab called <strong>Decks</strong
		>) to enter one row per deck. Add details like the deck name, commander or Archidekt link, and a
		short summary. The website uses this information to power commander previews and deck statistics.
	</p>
</section>

<!-- Step 3 -->
<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">3) Log game results while playing</h2>
	<p class="text-sm text-surface-200">
		During a game night, open the same spreadsheet in the
		<strong>Google Sheets mobile app</strong> on your phone. In the <strong>Games</strong> sheet, log
		each game: which deck you played, the winner, fun ratings, pod bracket, and any notes you want. Each
		row represents your deck in a single game. You only enter data. The website handles all calculations.
	</p>
</section>

<!-- Step 4 -->
<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">4) Analyze your data with dashboards</h2>
	<p class="text-sm text-surface-200">
		Once you have logged some games, go to the
		<a href="/dashboard" class="text-primary-300 hover:text-primary-200 underline underline-offset-2"
			>Dashboard</a
		>. You will see a pie chart of which decks you play the most, total games played, win rates
		per deck, and other statistics. The more games you record, the more accurate these insights become.
	</p>
</section>

<!-- Permissions explanation -->
<section class="space-y-2 p-4 rounded-xl bg-surface-800 border border-surface-700/40">
	<h2 class="text-lg font-semibold">Why does this site need Google permissions?</h2>
	<p class="text-sm text-surface-200">
		When you sign in, Google shows a consent screen listing the permissions this app requests. These
		are needed so the site can work with your spreadsheets:
	</p>
	<ul class="list-disc pl-5 text-sm text-surface-200 space-y-1">
		<li>
			<strong>Google Sheets access</strong>: required to read your EDH database spreadsheet and to
			update it when you create a database or change data through the site.
		</li>
		<li>
			<strong>Google Drive file metadata</strong>: used to list your spreadsheets so you can choose
			which one to use as the database. The app only looks at file names and IDs and only acts on
			the spreadsheet you select.
		</li>
	</ul>
</section>
