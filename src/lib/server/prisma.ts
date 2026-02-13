import prismaPkg from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma() {
	const { PrismaClient } = prismaPkg;
	if (globalForPrisma.prisma) return globalForPrisma.prisma;

	const connectionString = env.POSTGRES_PRISMA_URL ?? env.POSTGRES_URL ?? '';
	if (!connectionString) {
		throw new Error('POSTGRES_PRISMA_URL is not configured');
	}

	const pool = new Pool({ connectionString });
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
