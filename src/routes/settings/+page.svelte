<script lang="ts">
	export let data: {
		backend: string;
		user: { name: string | null; email: string | null } | null;
	};

	const backendLabel = 'Postgres (Supabase)';
</script>

<div class="space-y-6 max-w-4xl mx-auto">
	<header class="space-y-2">
		<h1 class="text-3xl font-semibold">Settings</h1>
		<p class="text-surface-300 text-sm">Manage your account and data backend.</p>
	</header>

	<section class="space-y-3 p-5 rounded-xl bg-surface-800 border border-surface-700/40">
		<h2 class="text-xl font-semibold">Database</h2>
		<p class="text-sm text-surface-300">
			Backend: <span class="text-surface-100">{backendLabel}</span>
		</p>
		<p class="text-sm text-surface-300">
			Your data lives in Postgres. No spreadsheet linking required.
		</p>
	</section>

	<section class="space-y-3 p-5 rounded-xl bg-surface-800 border border-surface-700/40">
		<h2 class="text-xl font-semibold">Account</h2>
		{#if data.user?.name || data.user?.email}
			<p class="text-sm text-surface-300">
				Signed in as <span class="text-surface-100">{data.user?.name ?? data.user?.email}</span>
			</p>
		{:else}
			<p class="text-sm text-surface-300">Sign in to manage your data.</p>
		{/if}
	</section>
</div>
