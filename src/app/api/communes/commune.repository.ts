import prisma from "@/lib/prisma";
import { PrismaTransaction } from "@/types/prisma.type";

const SELECT = { codesPostaux: true, arrondissementCode: true } as const;

export const findCommunesByNormalizedName = (
  nameNormalized: string,
  tx: PrismaTransaction = prisma
): Promise<CommuneReferentielRow[]> =>
  tx.commune.findMany({ where: { nameNormalized }, select: SELECT });

export const findCommunesByCodePostal = (
  codePostal: string,
  tx: PrismaTransaction = prisma
): Promise<CommuneReferentielRow[]> =>
  tx.commune.findMany({
    where: { codesPostaux: { has: codePostal } },
    select: SELECT,
  });

export type CommuneReferentielRow = {
  codesPostaux: string[];
  arrondissementCode: string | null;
};
