import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

export const DATABASE_POOL_MAX = Number(process.env.DATABASE_POOL_MAX) || 10;

export const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma Client.");
  }

  const adapter = new PrismaPg({
    connectionString,
    max: DATABASE_POOL_MAX,
    connectionTimeoutMillis: 5_000,
    application_name: process.env.CONTAINER ?? "bhasile",
  });
  return new PrismaClient({ adapter });
};
