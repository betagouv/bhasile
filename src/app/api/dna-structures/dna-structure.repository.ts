import { Prisma, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { DnaStructureApiType } from "@/schemas/api/dna-structure.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

import { resolveDnaByCode } from "../dna-codes/dna-codes.repository";
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
    operateurId: number | null;
    dnaCodes: string[];
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
      operateurId: true,
      structureVersions: {
        ...currentVersionArgs(now),
        select: {
          dnaStructures: {
            where: { dna: { code: { in: codes } } },
            select: { dna: { select: { code: true } } },
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
    .map(
      ({
        id,
        codeBhasile,
        type,
        fermetureDate,
        operateurId,
        structureVersions,
      }) => ({
        id,
        codeBhasile,
        type,
        fermetureDate,
        operateurId,
        dnaCodes: (structureVersions[0]?.dnaStructures ?? []).map(
          (dnaStructure) => dnaStructure.dna.code
        ),
      })
    );
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
    const resolvedDna = await resolveDnaByCode(tx, dnaStructure.dna);
    if (!resolvedDna) {
      continue;
    }
    await tx.dnaStructure.upsert({
      where: buildDnaStructureWhere(dnaStructure.id, entityId, resolvedDna.id),
      update: {
        dnaId: resolvedDna.id,
        description: dnaStructure.description,
      },
      create: {
        ...entityId,
        dnaId: resolvedDna.id,
        description: dnaStructure.description,
      },
    });
  }
};
