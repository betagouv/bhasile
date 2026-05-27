import { createPrismaClient } from "@/prisma-client";

const globalForPrisma = globalThis as typeof globalThis & {
  __e2ePrisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.__e2ePrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__e2ePrisma = prisma;
}
