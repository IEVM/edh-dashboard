import prismaPkg from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

const globalForPrisma = globalThis as unknown as {
	prisma?: PrismaClient;
	prismaLogged?: boolean;
};

export function getPrisma() {
	const { PrismaClient } = prismaPkg;
	if (globalForPrisma.prisma) return globalForPrisma.prisma;

	const isVercel = env.VERCEL === '1' || env.VERCEL === 'true';
	const connectionString = isVercel
		? env.POSTGRES_PRISMA_URL ?? ''
		: env.POSTGRES_URL_OVERRIDE ??
			env.POSTGRES_URL_NON_POOLING ??
			env.POSTGRES_PRISMA_URL ??
			env.POSTGRES_URL ??
			'';
	if (!connectionString) {
		if (isVercel) {
			throw new Error('POSTGRES_PRISMA_URL is required on Vercel runtime');
		}
		throw new Error(
			'Database connection is not configured (POSTGRES_URL_OVERRIDE/POSTGRES_URL_NON_POOLING/POSTGRES_PRISMA_URL/POSTGRES_URL)'
		);
	}

	const disableSslVerify = true;
	const pool = new Pool({
		connectionString,
		ssl: disableSslVerify ? { rejectUnauthorized: false } : undefined
	});
	const adapter = new PrismaPg(pool);
	const client = new PrismaClient({
		log: ['error'],
		adapter
	});

	if (process.env.NODE_ENV !== 'production') {
		globalForPrisma.prisma = client;
	}

	if (!globalForPrisma.prismaLogged) {
		let host = 'unknown';
		try {
			host = new URL(connectionString).host || host;
		} catch {
			// ignore parse errors, keep host as unknown
		}
		const source = isVercel
			? 'POSTGRES_PRISMA_URL'
			: env.POSTGRES_URL_OVERRIDE
				? 'POSTGRES_URL_OVERRIDE'
				: env.POSTGRES_URL_NON_POOLING
					? 'POSTGRES_URL_NON_POOLING'
					: env.POSTGRES_PRISMA_URL
						? 'POSTGRES_PRISMA_URL'
						: env.POSTGRES_URL
							? 'POSTGRES_URL'
							: 'unknown';
		console.info(
			`[db] connection source=${source} host=${host} sslVerify=${!disableSslVerify}`
		);
		globalForPrisma.prismaLogged = true;
	}

	return client;
}
