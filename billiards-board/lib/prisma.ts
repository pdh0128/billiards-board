import { PrismaClient } from '@prisma/client';

// use a unique global key to avoid reusing old client instances when schema changes during dev
const globalForPrisma = globalThis as unknown as {
  prismaVoteBoard?: PrismaClient;
};

export const prisma =
  globalForPrisma.prismaVoteBoard ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaVoteBoard = prisma;

export default prisma;
