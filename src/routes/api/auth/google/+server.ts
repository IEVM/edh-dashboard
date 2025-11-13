import { redirect } from '@sveltejs/kit';
import { getAuthUrl } from '$lib/server/google';

export async function GET() {
  const url = getAuthUrl();
  throw redirect(302, url);
}
