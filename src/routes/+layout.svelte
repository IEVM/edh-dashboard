<script lang="ts">
	import '../app.postcss';

	import { Avatar } from '@skeletonlabs/skeleton';

	export let data: {
		isAuthenticated: boolean;
		hasDatabase: boolean;
		currentPath: string;
		user: { name: string | null; email: string | null; picture: string | null } | null;
	};
	let mobileOpen = false;

	const navItems = [
		{ href: '/', label: 'Home' },
		{ href: '/decks', label: 'Decks', requiresAuth: true, requiresDb: true },
		{ href: '/settings', label: 'Settings', requiresAuth: true },
		{ href: '/dashboard', label: 'Dashboard', requiresAuth: true, requiresDb: true },
	];

	const authRequiredPrefixes = ['/settings', '/decks', '/dashboard'];
	$: requiresAuthForPath = authRequiredPrefixes.some(
		(prefix) => data.currentPath === prefix || data.currentPath.startsWith(`${prefix}/`)
	);
	$: showSessionBanner = !data.isAuthenticated && requiresAuthForPath;

	function goToLogin() {
		const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		window.location.href = `/login?returnTo=${encodeURIComponent(current || '/')}`;
	}
</script>

<div class="min-h-screen bg-surface-900 text-surface-50 flex flex-col">
	<header class="border-b border-surface-700/60 bg-surface-900/95 backdrop-blur z-10">
		<div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<button
					class="btn variant-outlined-surface-500 p-2 md:hidden"
					type="button"
					aria-label="Toggle navigation"
					aria-expanded={mobileOpen}
					aria-controls="mobile-nav"
					on:click={() => (mobileOpen = !mobileOpen)}
				>
					<svg class="w-5 h-5 text-surface-200" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M2.5 5.5a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H3.25a.75.75 0 0 1-.75-.75zm0 4.5a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H3.25A.75.75 0 0 1 2.5 10zm0 4.5a.75.75 0 0 1 .75-.75h13.5a.75.75 0 0 1 0 1.5H3.25a.75.75 0 0 1-.75-.75z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
				<div class="text-lg font-semibold">EDH Dashboard</div>
			</div>

			<nav class="hidden md:flex items-center gap-4">
				{#each navItems as item}
					{#if (!item.requiresAuth || data.isAuthenticated) && (!item.requiresDb || data.hasDatabase)}
						<a
							href={item.href}
							class="text-sm pb-1
              {data.currentPath === item.href
								? 'text-primary-300 border-b-2 border-primary-400'
								: 'text-surface-200 hover:text-primary-300'}"
						>
							{item.label}
						</a>
					{/if}
				{/each}
			</nav>

			<div>
				{#if data.isAuthenticated}
					<div class="flex items-center gap-2">
						<div class="hidden sm:flex flex-col items-end leading-tight">
							<span class="text-xs text-surface-300">Signed in</span>
							{#if data.user?.name || data.user?.email}
								<span class="text-xs text-surface-100">
									{data.user?.name ?? data.user?.email}
								</span>
							{/if}
						</div>
						<Avatar
							class="rounded-full"
							size="32"
							src={data.user?.picture ??
								'https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png'}
						/>
					</div>
				{:else}
					<button
						class="btn variant-filled-primary-500 text-xs sm:text-sm px-3 sm:px-4 py-2"
						type="button"
						on:click={goToLogin}
					>
						Sign in
					</button>
				{/if}
			</div>
		</div>
	</header>

	{#if showSessionBanner}
		<div class="border-b border-error-600/40 bg-error-500/15">
			<div
				class="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
			>
				<div class="text-sm text-error-200">Session expired. Sign in to continue.</div>
				<button
					class="btn variant-filled-primary-500 text-xs sm:text-sm px-3 sm:px-4 py-2"
					on:click={goToLogin}
				>
					Sign in
				</button>
			</div>
		</div>
	{/if}

	{#if mobileOpen}
		<button
			class="fixed inset-0 bg-black/50 z-20 md:hidden"
			type="button"
			aria-label="Close navigation"
			on:click={() => (mobileOpen = false)}
		></button>
		<aside
			id="mobile-nav"
			class="fixed top-0 left-0 h-full w-72 bg-surface-900 border-r border-surface-700/60 z-30 md:hidden"
		>
			<div class="px-4 py-4 flex items-center justify-between border-b border-surface-700/60">
				<span class="text-sm font-semibold">Navigation</span>
				<button
					class="btn variant-outlined-surface-500 p-2"
					type="button"
					aria-label="Close navigation"
					on:click={() => (mobileOpen = false)}
				>
					<svg class="w-4 h-4 text-surface-200" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M4.22 4.22a.75.75 0 0 1 1.06 0L10 8.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L11.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 0 1 0-1.06z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>
			</div>
			<nav class="flex flex-col gap-3 px-4 py-4">
				{#each navItems as item}
					{#if (!item.requiresAuth || data.isAuthenticated) && (!item.requiresDb || data.hasDatabase)}
						<a
							href={item.href}
							class="text-sm text-surface-200 hover:text-primary-300"
							on:click={() => (mobileOpen = false)}
						>
							{item.label}
						</a>
					{/if}
				{/each}
			</nav>
		</aside>
	{/if}

	<main class="flex-1">
		<section class="space-y-8 max-w-5xl mx-auto px-4 py-6">
			<slot />
		</section>
	</main>

	<footer class="border-t border-surface-700/60 bg-surface-900/95">
		<div
			class="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between text-xs text-surface-400"
		>
			<span>EDH Dashboard</span>
			<span>Built with SvelteKit</span>
		</div>
	</footer>
</div>
