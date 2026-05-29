import { DnaStructureApiType } from "@/schemas/api/dna-structure.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

import { upsertDna } from "../dna-codes/dna-codes.repository";
import { getUniqueDnaCodesFromDnaStructures } from "./dna-structure.service";

const deleteDnaStructures = async (
  tx: PrismaTransaction,
  dnaStructuresToKeep: Partial<DnaStructureApiType>[],
  entityId: EntityId
): Promise<void> => {
  const everyDnaStructuresOfEntity = await tx.dnaStructure.findMany({
    where: entityId,
  });
  const dnaStructuresToDelete = everyDnaStructuresOfEntity.filter(
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
  entityId: EntityId
): Promise<void> => {
  // Le contrôle d'unicité protège le flux d'édition d'une structure. Les versions de
  // transformation sont des brouillons : on autorise un code DNA déjà actif ailleurs
  // (ex. recopie d'une structure qui ferme dans la nouvelle version).
  if (entityId.structureVersionId !== undefined) {
    return;
  }

  const dnaCodes = getUniqueDnaCodesFromDnaStructures(dnaStructures);

  if (dnaCodes.length === 0) {
    return;
  }

  const dnaLinkedToOtherStructures = await tx.dnaStructure.findMany({
    where: {
      NOT: entityId,
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
  entityId: EntityId
): Promise<void> => {
  if (!dnaStructures || dnaStructures.length === 0) {
    return;
  }

  await deleteDnaStructures(tx, dnaStructures, entityId);

  await checkForDuplicateDnaCodes(tx, dnaStructures, entityId);

  for (const dnaStructure of dnaStructures) {
    const upsertedDna = await upsertDna(tx, dnaStructure.dna);
    if (!upsertedDna) {
      continue;
    }

    await tx.dnaStructure.upsert({
      where: { id: dnaStructure.id || 0 },
      update: {
        dnaId: upsertedDna.id,
        startDate: dnaStructure.startDate,
        endDate: dnaStructure.endDate,
      },
      create: {
        ...entityId,
        dnaId: upsertedDna.id,
        startDate: dnaStructure.startDate,
        endDate: dnaStructure.endDate,
      },
    });
  }
};
