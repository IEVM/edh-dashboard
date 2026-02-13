import prismaPkg from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma() {
	const { PrismaClient } = prismaPkg;
	if (globalForPrisma.prisma) return globalForPrisma.prisma;

	const connectionString =
		env.POSTGRES_PRISMA_URL ??
		env.POSTGRES_URL ??
		env.POSTGRES_URL_NON_POOLING ??
		env.POSTGRES_URL_OVERRIDE ??
		'';
	if (!connectionString) {
		throw new Error(
			'Database connection is not configured (POSTGRES_URL_OVERRIDE/POSTGRES_URL_NON_POOLING/POSTGRES_PRISMA_URL/POSTGRES_URL)'
		);
	}

	const disableSslVerify =
		connectionString.includes('pooler.supabase.com') ||
		connectionString.includes('pgbouncer=true');
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

	return client;
}
