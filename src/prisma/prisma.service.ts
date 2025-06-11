import { PrismaClient } from 'generated/prisma';

let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ['error', 'info', 'warn', 'query', 'info'],
    });
  }
  return prisma;
};
