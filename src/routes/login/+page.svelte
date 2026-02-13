<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase/client';

	let mode: 'signIn' | 'signUp' = 'signIn';
	let email = '';
	let password = '';
	let authError = '';
	let authNotice = '';
	let authLoading = false;

	$: returnToParam = $page.url.searchParams.get('returnTo') ?? '/';
	$: returnTo = sanitizeReturnTo(returnToParam);

	function sanitizeReturnTo(value: string) {
		if (!value.startsWith('/') || value.startsWith('//')) return '/';
		return value;
	}

	async function signInWithGoogle() {
		await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
			}
		});
	}

	async function submitEmailAuth() {
		authError = '';
		authNotice = '';
		authLoading = true;

		try {
			if (!email.trim() || !password.trim()) {
				authError = 'Email and password are required.';
				return;
			}

			if (mode === 'signUp') {
				const { data, error } = await supabase.auth.signUp({
					email: email.trim(),
					password
				});

				if (error) {
					authError = error.message;
					return;
				}

				if (!data.session) {
					authNotice = 'Check your email to confirm your account.';
					return;
				}
			} else {
				const { error } = await supabase.auth.signInWithPassword({
					email: email.trim(),
					password
				});

				if (error) {
					authError = error.message;
					return;
				}
			}

			await goto(returnTo);
		} finally {
			authLoading = false;
		}
	}
</script>

<div class="max-w-md mx-auto space-y-6">
	<header class="space-y-2">
		<h1 class="text-3xl font-semibold">Sign in</h1>
		<p class="text-sm text-surface-300">
			Continue to your dashboard. You can use Google or an email + password.
		</p>
	</header>

	<div class="rounded-xl border border-surface-700/60 bg-surface-800 p-5 space-y-4">
		<button class="btn variant-filled-primary-500 w-full" on:click={signInWithGoogle}>
			Continue with Google
		</button>

		<div class="flex items-center gap-3 text-xs text-surface-400">
			<span class="h-px flex-1 bg-surface-700/60"></span>
			<span>or</span>
			<span class="h-px flex-1 bg-surface-700/60"></span>
		</div>

		<div class="space-y-3">
			<div class="space-y-2">
				<label class="text-xs text-surface-300" for="auth-email">Email</label>
				<input
					id="auth-email"
					type="email"
					class="input w-full"
					placeholder="you@example.com"
					bind:value={email}
				/>
			</div>
			<div class="space-y-2">
				<label class="text-xs text-surface-300" for="auth-password">Password</label>
				<input
					id="auth-password"
					type="password"
					class="input w-full"
					placeholder="••••••••"
					bind:value={password}
				/>
			</div>
		</div>

		{#if authError}
			<div class="text-xs text-error-300">{authError}</div>
		{/if}
		{#if authNotice}
			<div class="text-xs text-surface-300">{authNotice}</div>
		{/if}

		<div class="flex flex-col sm:flex-row sm:items-center gap-2">
			<button
				class="btn variant-filled-primary-500 flex-1"
				type="button"
				disabled={authLoading}
				on:click={submitEmailAuth}
			>
				{mode === 'signIn' ? 'Sign in' : 'Create account'}
			</button>
			<button
				class="btn variant-outlined-surface-500 flex-1"
				type="button"
				on:click={() => (mode = mode === 'signIn' ? 'signUp' : 'signIn')}
			>
				{mode === 'signIn' ? 'Need an account?' : 'Have an account?'}
			</button>
		</div>
	</div>
</div>
