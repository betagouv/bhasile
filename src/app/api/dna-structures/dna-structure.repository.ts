import { DnaStructureApiType } from "@/schemas/api/dna-structure.schema";
import { PrismaTransaction } from "@/types/prisma.type";

const deleteDnaStructures = async (
  tx: PrismaTransaction,
  dnaStructuresToKeep: Partial<DnaStructureApiType>[],
  structureId: number
): Promise<void> => {
  const everyDnaStructuresOfStructure = await tx.dnaStructure.findMany({
    where: { structureId },
  });
  const dnaStructuresToDelete = everyDnaStructuresOfStructure.filter(
    (dnaStructure) =>
      !dnaStructuresToKeep.some((ds) => ds.id === dnaStructure.id)
  );
  await Promise.all(
    dnaStructuresToDelete.map((dnaStructure) =>
      tx.dnaStructure.delete({ where: { id: dnaStructure.id } })
    )
  );
};

const checkForDuplicateDnaCodes = async (
  tx: PrismaTransaction,
  dnaStructures: Partial<DnaStructureApiType>[] = [],
  structureId: number
): Promise<void> => {
  const dnaCodes = [
    ...new Set(
      dnaStructures
        .map((dnaStructure) => dnaStructure.dna?.code?.trim())
        .filter((code): code is string => Boolean(code))
    ),
  ];

  if (dnaCodes.length === 0) {
    return;
  }

  const dnaLinkedToOtherStructures = await tx.dnaStructure.findMany({
    where: {
      structureId: {
        not: structureId,
      },
      dna: {
        code: {
          in: dnaCodes,
        },
      },
      endDate: null,
    },
  });

  if (dnaLinkedToOtherStructures.length > 0) {
    throw new Error("Ce ou ces codes DNA sont déjà liés à d'autres structures");
  }
};

export const createOrUpdateDnaStructures = async (
  tx: PrismaTransaction,
  dnaStructures: Partial<DnaStructureApiType>[] = [],
  structureId: number
): Promise<void> => {
  if (!dnaStructures || dnaStructures.length === 0) {
    return;
  }

  await deleteDnaStructures(tx, dnaStructures, structureId);

  await checkForDuplicateDnaCodes(tx, dnaStructures, structureId);

  for (const dnaStructure of dnaStructures) {
    const dna = dnaStructure.dna;
    if (!dna?.code) {
      continue;
    }

    const normalizedCode = dna.code.trim();
    const upsertedDna = await tx.dna.upsert({
      where: { code: normalizedCode },
      update: { description: dna.description },
      create: {
        code: normalizedCode,
        description: dna.description,
      },
    });

    await tx.dnaStructure.upsert({
      where: { id: dnaStructure.id || 0 },
      update: {
        dnaId: upsertedDna.id,
        startDate: dnaStructure.startDate,
        endDate: dnaStructure.endDate,
      },
      create: {
        structureId,
        dnaId: upsertedDna.id,
        startDate: dnaStructure.startDate,
        endDate: dnaStructure.endDate,
      },
    });
  }
};
