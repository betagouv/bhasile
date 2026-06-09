import { createPrismaClient } from "@/prisma-client";

if (process.env.NODE_ENV === "production") {
  throw new Error("Les tests e2e ne doivent pas être exécutés en production");
}

const globalForPrisma = globalThis as typeof globalThis & {
  __e2ePrisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.__e2ePrisma ?? createPrismaClient();
globalForPrisma.__e2ePrisma = prisma;
