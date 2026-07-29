import { Dna, Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

export const findAll = async ({
  entityId = {},
  operateurId,
  transformationId,
}: {
  entityId?: EntityId;
  operateurId?: number;
  transformationId?: number;
} = {}): Promise<{ code: string }[]> => {
  const { structureVersionId } = entityId;

  const ownershipFilters: Prisma.DnaWhereInput[] = [
    { dnaStructures: { none: {} } },
  ];
  if (structureVersionId) {
    ownershipFilters.push({
      dnaStructures: { some: { structureVersionId } },
    });
  }
  if (transformationId) {
    ownershipFilters.push({
      dnaStructures: {
        some: {
          structureVersion: {
            structureVersionTransformation: { transformationId },
          },
        },
      },
    });
  }
  const structureFilter: Prisma.DnaWhereInput = { OR: ownershipFilters };

  const operateurFilter = operateurId !== undefined ? { operateurId } : null;

  return prisma.dna.findMany({
    where: operateurFilter
      ? { AND: [structureFilter, operateurFilter] }
      : structureFilter,
    select: { code: true },
    distinct: ["code"],
  });
};

// Un DNA n'existe que via l'import du référentiel OFII. On se contente donc de résoudre le code existant
export const upsertDna = async (
  tx: PrismaTransaction,
  dna: { code?: string | null } | undefined | null
): Promise<Dna | null> => {
  const normalizedCode = dna?.code?.trim();
  if (!normalizedCode) {
    return null;
  }

  const existing = await tx.dna.findUnique({
    where: { code: normalizedCode },
  });
  if (!existing) {
    throw new Error(
      `Code DNA inconnu du référentiel : ${normalizedCode}. Un DNA ne peut être créé que par l'import du référentiel OFII.`
    );
  }
  return existing;
};
