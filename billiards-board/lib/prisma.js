/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

// Mirror the TypeScript prisma singleton in CJS for server.js (node runs without TS transpilation)
const globalForPrisma = globalThis;

globalForPrisma.prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

module.exports = { prisma: globalForPrisma.prisma };
module.exports.default = globalForPrisma.prisma;
