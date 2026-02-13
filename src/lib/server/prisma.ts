import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const connectionString =
	process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL ?? '';

if (!connectionString) {
	throw new Error('POSTGRES_PRISMA_URL is not configured');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: ['error'],
		adapter
	});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
