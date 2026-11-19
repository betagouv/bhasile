import prisma from "@/lib/prisma";

import { OfiiActivite, OfiiDna, OfiiReferential } from "./ofii-import.util";

const absentFromFileWhere = (codes: string[]) => ({
  code: { notIn: codes },
  inactiveInOfiiFileSince: null,
});

export const findOfiiReferential = async (): Promise<OfiiReferential> => ({
  departements: await prisma.departement.findMany({
    select: {
      numero: true,
      name: true,
      regionAdministrative: { select: { name: true, code: true } },
    },
  }),
  operateurs: await prisma.operateur.findMany({
    select: { id: true, name: true, ofiiNames: true },
  }),
});

export const findOfiiDnaChanges = async (codes: string[]) => ({
  existingDnas: await prisma.dna.findMany({
    where: { code: { in: codes } },
    select: { code: true, inactiveInOfiiFileSince: true },
  }),
  deactivatedCount: await prisma.dna.count({
    where: absentFromFileWhere(codes),
  }),
});

export const findLatestOfiiActiviteDate = async (): Promise<Date | null> =>
  (await prisma.activite.aggregate({ _max: { date: true } }))._max.date;

export const saveOfiiImport = async (
  date: Date,
  dnas: OfiiDna[],
  activites: OfiiActivite[]
): Promise<number> => {
  const codes = dnas.map((dna) => dna.code);
  const [{ count: deactivatedCount }] = await prisma.$transaction([
    prisma.dna.updateMany({
      where: absentFromFileWhere(codes),
      data: { inactiveInOfiiFileSince: date },
    }),
    prisma.dna.updateMany({
      where: { code: { in: codes }, activeInOfiiFileSince: null },
      data: { activeInOfiiFileSince: date },
    }),
    ...dnas.map((dna) =>
      prisma.dna.upsert({
        where: { code: dna.code },
        create: {
          ...dna,
          activeInOfiiFileSince: date,
          inactiveInOfiiFileSince: null,
        },
        update: { ...dna, inactiveInOfiiFileSince: null },
      })
    ),
    ...activites.map(({ dnaCode, ...data }) =>
      prisma.activite.upsert({
        where: { dnaCode_date: { dnaCode, date } },
        create: { dnaCode, date, ...data },
        update: data,
      })
    ),
  ]);
  return deactivatedCount;
};
