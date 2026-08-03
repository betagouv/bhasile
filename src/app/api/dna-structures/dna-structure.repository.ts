import { Prisma, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { DnaStructureApiType } from "@/schemas/api/dna-structure.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

import { upsertDna } from "../dna-codes/dna-codes.repository";
import {
  currentVersionArgs,
  currentVersionWhere,
} from "../structure-versions/structure-version.db.type";

/* Un code DNA appartient à la structure dont la version courante le porte */
export const findStructuresByCurrentDnaCodes = async (
  codes: string[],
  now: Date
): Promise<
  {
    id: number;
    codeBhasile: string;
    type: StructureType | null;
    fermetureDate: Date | null;
  }[]
> => {
  const structures = await prisma.structure.findMany({
    where: {
      structureVersions: {
        some: {
          ...currentVersionWhere(now),
          dnaStructures: { some: { dna: { code: { in: codes } } } },
        },
      },
    },
    select: {
      id: true,
      codeBhasile: true,
      type: true,
      fermetureDate: true,
      structureVersions: {
        ...currentVersionArgs(now),
        select: {
          dnaStructures: {
            where: { dna: { code: { in: codes } } },
            select: { id: true },
          },
        },
      },
    },
  });

  return structures
    .filter(
      ({ structureVersions }) =>
        (structureVersions[0]?.dnaStructures.length ?? 0) > 0
    )
    .map(({ id, codeBhasile, type, fermetureDate }) => ({
      id,
      codeBhasile,
      type,
      fermetureDate,
    }));
};

const buildDnaStructureWhere = (
  dnaStructureId: number | undefined,
  entityId: EntityId,
  dnaId: number
): Prisma.DnaStructureWhereUniqueInput => {
  if (dnaStructureId) {
    return { id: dnaStructureId };
  }
  if (entityId.structureVersionId != null) {
    return {
      structureVersionId_dnaId: {
        structureVersionId: entityId.structureVersionId,
        dnaId,
      },
    };
  }
  if (entityId.structureId != null) {
    return { structureId_dnaId: { structureId: entityId.structureId, dnaId } };
  }
  return { id: 0 };
};

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

export const createOrUpdateDnaStructures = async (
  tx: PrismaTransaction,
  dnaStructures: Partial<DnaStructureApiType>[] = [],
  entityId: EntityId
): Promise<void> => {
  if (!dnaStructures || dnaStructures.length === 0) {
    return;
  }

  await deleteDnaStructures(tx, dnaStructures, entityId);

  //TODO: Once structureVersion is implemented, check for DNA associated to other structures

  for (const dnaStructure of dnaStructures) {
    const upsertedDna = await upsertDna(tx, dnaStructure.dna);
    if (!upsertedDna) {
      continue;
    }
    await tx.dnaStructure.upsert({
      where: buildDnaStructureWhere(dnaStructure.id, entityId, upsertedDna.id),
      update: {
        dnaId: upsertedDna.id,
        description: dnaStructure.description,
        startDate: dnaStructure.startDate,
        endDate: dnaStructure.endDate,
      },
      create: {
        ...entityId,
        dnaId: upsertedDna.id,
        description: dnaStructure.description,
        startDate: dnaStructure.startDate,
        endDate: dnaStructure.endDate,
      },
    });
  }
};
