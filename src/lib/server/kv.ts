import { Redis } from '@upstash/redis';

type StoredEntry = {
	value: unknown;
	expiresAt: number | null;
};

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = !!upstashUrl && !!upstashToken;

const upstash = useUpstash
	? new Redis({ url: upstashUrl as string, token: upstashToken as string })
	: null;

const memoryStore = new Map<string, StoredEntry>();

function isExpired(entry: StoredEntry): boolean {
	return entry.expiresAt !== null && entry.expiresAt <= Date.now();
}

export async function kvGet<T>(key: string): Promise<T | null> {
	if (useUpstash) {
		return (await upstash!.get<T>(key)) ?? null;
	}

	const entry = memoryStore.get(key);
	if (!entry) return null;
	if (isExpired(entry)) {
		memoryStore.delete(key);
		return null;
	}

	return entry.value as T;
}

export async function kvSet<T>(key: string, value: T, ttlSeconds?: number) {
	if (useUpstash) {
		if (ttlSeconds) {
			await upstash!.set(key, value, { ex: ttlSeconds });
		} else {
			await upstash!.set(key, value);
		}
		return;
	}

	const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
	memoryStore.set(key, { value, expiresAt });
}
