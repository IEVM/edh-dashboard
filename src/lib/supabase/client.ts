import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl =
	import.meta.env.NEXT_PUBLIC_SUPABASE_URL ??
	import.meta.env.PUBLIC_SUPABASE_URL ??
	'http://localhost';
const supabaseAnonKey =
	import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
	import.meta.env.PUBLIC_SUPABASE_ANON_KEY ??
	'anon';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
