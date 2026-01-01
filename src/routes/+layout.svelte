<script lang="ts">
	import '../app.postcss';

	import { Avatar } from '@skeletonlabs/skeleton';

	export let data: { isAuthenticated: boolean; currentPath: string };

	const navItems = [
		{ href: '/', label: 'Home' },
		{ href: '/decks', label: 'Decks' },
		{ href: '/settings', label: 'Settings' },
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/guide', label: 'Guide' }
	];

	/**
	 * Starts the Google OAuth flow by navigating to the auth endpoint.
	 */
	function signInWithGoogle() {
		window.location.href = '/api/auth/google';
	}
</script>

<div class="min-h-screen bg-surface-900 text-surface-50 flex flex-col">
	<header class="border-b border-surface-700/60 bg-surface-900/95 backdrop-blur z-10">
		<div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
			<div class="text-lg font-semibold">EDH Dashboard</div>

			<nav class="flex items-center gap-4">
				{#each navItems as item}
					<a
						href={item.href}
						class="text-sm pb-1
              {data.currentPath === item.href
							? 'text-primary-300 border-b-2 border-primary-400'
							: 'text-surface-200 hover:text-primary-300'}"
					>
						{item.label}
					</a>
				{/each}
			</nav>

			<div>
				{#if data.isAuthenticated}
					<div class="flex items-center gap-2">
						<span class="text-xs text-surface-300">Signed in</span>
						<Avatar
							class="rounded-full"
							size="32"
							src="https://www.gstatic.com/images/branding/product/1x/avatar_circle_blue_512dp.png"
						/>
					</div>
				{:else}
					<button class="btn variant-filled-primary-500 text-sm" on:click={signInWithGoogle}>
						Sign in with Google
					</button>
				{/if}
			</div>
		</div>
	</header>

	<main class="flex-1">
		<section class="space-y-8 max-w-5xl mx-auto">
			<slot />
		</section>
	</main>
</div>
