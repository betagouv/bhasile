import prisma from "@/lib/prisma";

import { OfiiActivite, OfiiDna, OfiiReferential } from "./ofii-import.util";

const REFERENTIAL_TRANSACTION_TIMEOUT_MS = 60_000;

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

export const saveOfiiDnas = (date: Date, dnas: OfiiDna[]) =>
  prisma.$transaction(
    async (tx) => {
      for (const dna of dnas) {
        await tx.dna.upsert({
          where: { code: dna.code },
          create: {
            ...dna,
            activeInOfiiFileSince: date,
            inactiveInOfiiFileSince: null,
          },
          update: { ...dna, inactiveInOfiiFileSince: null },
        });
      }
      const codes = dnas.map((dna) => dna.code);
      await tx.dna.updateMany({
        where: { code: { in: codes }, activeInOfiiFileSince: null },
        data: { activeInOfiiFileSince: date },
      });
      return tx.dna.updateMany({
        where: { code: { notIn: codes }, inactiveInOfiiFileSince: null },
        data: { inactiveInOfiiFileSince: date },
      });
    },
    { timeout: REFERENTIAL_TRANSACTION_TIMEOUT_MS }
  );

export const saveOfiiActivites = async (
  date: Date,
  activites: OfiiActivite[]
): Promise<void> => {
  for (const { dnaCode, ...data } of activites) {
    await prisma.activite.upsert({
      where: { dnaCode_date: { dnaCode, date } },
      create: { dnaCode, date, ...data },
      update: data,
    });
  }
};
