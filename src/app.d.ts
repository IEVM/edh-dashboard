// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	interface Locals {
		sessionId: string;
		requestId?: string;
		supabase: import('@supabase/supabase-js').SupabaseClient;
		getSession: () => Promise<{
			session: import('@supabase/supabase-js').Session | null;
			error: import('@supabase/supabase-js').AuthError | null;
		}>;
	}
	// interface PageData {}
	// interface Error {}
	// interface Platform {}
}
