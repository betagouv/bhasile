import { PrismaClient } from "@/generated/prisma/client";

const PRESERVED_TABLES = ["_prisma_migrations"];

// Un TRUNCATE unique remplace la trentaine de deleteMany ordonnés : CASCADE gère
// les dépendances et RESTART IDENTITY remet les séquences à zéro, ce dont dépend
// la pré-attribution des identifiants côté seed.
export const wipeTables = async (prisma: PrismaClient): Promise<void> => {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> ALL (${PRESERVED_TABLES})
  `;

  if (tables.length === 0) {
    return;
  }

  const targets = tables
    .map(({ tablename }) => `"public"."${tablename}"`)
    .join(", ");

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${targets} RESTART IDENTITY CASCADE`
  );
};
