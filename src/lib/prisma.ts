import { PrismaClient } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? createPrismaClient();
globalForPrisma.prisma = prisma;

export default prisma;
