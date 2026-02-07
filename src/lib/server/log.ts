import { env } from '$env/dynamic/private';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
	silent: 99
};

const configuredLevel = (env.LOG_LEVEL as LogLevel | undefined) ?? 'info';
const effectiveLevel =
	env.E2E_TEST_MODE === '1' ? 'silent' : configuredLevel in LEVEL_WEIGHT ? configuredLevel : 'info';

const REDACT_KEYS = ['token', 'secret', 'authorization', 'cookie', 'password', 'code'];

function shouldLog(level: LogLevel) {
	return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[effectiveLevel];
}

function hashSessionId(value: string | undefined | null): string | undefined {
	if (!value) return undefined;
	let hash = 2166136261;
	for (let i = 0; i < value.length; i += 1) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return `s_${(hash >>> 0).toString(16)}`;
}

function sanitizeValue(value: unknown): unknown {
	if (value instanceof Error) {
		return { name: value.name, message: value.message };
	}

	if (typeof value === 'string') {
		return value.length > 200 ? `${value.slice(0, 200)}…` : value;
	}

	if (Array.isArray(value)) {
		return value.map((entry) => sanitizeValue(entry));
	}

	if (value && typeof value === 'object') {
		const result: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(value)) {
			const lower = key.toLowerCase();
			if (REDACT_KEYS.some((k) => lower.includes(k))) {
				result[key] = '[redacted]';
			} else {
				result[key] = sanitizeValue(val);
			}
		}
		return result;
	}

	return value;
}

function sanitizeContext(context: Record<string, unknown>) {
	const sanitized = sanitizeValue(context);
	return (
		sanitized && typeof sanitized === 'object' && !Array.isArray(sanitized) ? sanitized : {}
	) as Record<string, unknown>;
}

export function logEvent(level: LogLevel, event: string, context: Record<string, unknown> = {}) {
	if (!shouldLog(level)) return;

	const payload = {
		ts: new Date().toISOString(),
		level,
		event,
		...sanitizeContext(context)
	};

	if (level === 'error') {
		console.error(JSON.stringify(payload));
	} else if (level === 'warn') {
		console.warn(JSON.stringify(payload));
	} else {
		console.log(JSON.stringify(payload));
	}
}

export function logInfo(event: string, context?: Record<string, unknown>) {
	logEvent('info', event, context);
}

export function logWarn(event: string, context?: Record<string, unknown>) {
	logEvent('warn', event, context);
}

export function logError(event: string, context?: Record<string, unknown>) {
	logEvent('error', event, context);
}

export function sessionHash(sessionId: string | undefined | null) {
	return hashSessionId(sessionId ?? undefined);
}
