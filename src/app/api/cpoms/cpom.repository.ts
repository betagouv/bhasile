import { CpomMillesimeApiType } from "@/schemas/api/cpom.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { findMatchingCpomForMillesime } from "./cpom.service";

export const createOrUpdateCpomMillesimes = async (
  tx: PrismaTransaction,
  millesimes: CpomMillesimeApiType[] | undefined,
  structureDnaCode: string
): Promise<void> => {
  if (!millesimes || millesimes.length === 0) {
    return;
  }

  const structure = await tx.structure.findUnique({
    where: { dnaCode: structureDnaCode },
    select: { id: true },
  });

  if (!structure) {
    throw new Error(
      `Structure avec le code DNA ${structureDnaCode} non trouvée`
    );
  }

  const cpomStructures = await tx.cpomStructure.findMany({
    where: { structureId: structure.id },
    include: {
      cpom: {
        select: {
          id: true,
          yearStart: true,
          dateStart: true,
          yearEnd: true,
          dateEnd: true,
        },
      },
    },
  });

  if (cpomStructures.length === 0) {
    console.warn(
      `Aucun CPOM associé à la structure ${structureDnaCode}, millésimes ignorés`
    );
    return;
  }

  await Promise.all(
    millesimes.map(async (millesime) => {
      const resolved = findMatchingCpomForMillesime(cpomStructures, millesime);

      if (!resolved) {
        console.warn(
          `Aucun CPOM trouvé pour la structure ${structureDnaCode} avec une période couvrant l'année ${millesime.year}, millésime ignoré`
        );
        return;
      }

      const { cpomId, year } = resolved;

      return tx.cpomMillesime.upsert({
        where: {
          cpomId_year: {
            cpomId,
            year,
          },
        },
        update: millesime,
        create: {
          cpomId,
          ...millesime,
          year,
        },
      });
    })
  );
};
