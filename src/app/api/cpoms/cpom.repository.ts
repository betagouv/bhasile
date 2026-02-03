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
          dateStart: true,
          dateEnd: true,
          avenants: {
            select: { dateEnd: true },
            orderBy: { dateEnd: "desc" },
          },
        },
      },
    },
  });

  // Date de fin effective en considérant les avenants
  const cpomStructuresWithEffectiveEnd = cpomStructures.map((cs) => {
    const cpom = cs.cpom;
    const dateEndWithAvenants =
      cpom.avenants.length > 0
        ? cpom.avenants.reduce(
            (max, a) => (a.dateEnd > max ? a.dateEnd : max),
            cpom.dateEnd ?? cpom.avenants[0].dateEnd
          )
        : cpom.dateEnd;

    return {
      dateStart: cs.dateStart,
      dateEnd: dateEndWithAvenants,
      cpom: {
        id: cpom.id,
        dateStart: cpom.dateStart,
        dateEnd: dateEndWithAvenants,
        initialDateEnd: cpom.dateEnd,
      },
    };
  });

  if (cpomStructures.length === 0) {
    console.warn(
      `Aucun CPOM associé à la structure ${structureDnaCode}, millésimes ignorés`
    );
    return;
  }

  await Promise.all(
    millesimes.map(async (millesime) => {
      const resolved = findMatchingCpomForMillesime(
        cpomStructuresWithEffectiveEnd,
        millesime
      );

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
