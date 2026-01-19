// @ts-nocheck
// One-off script: populate newly added `year` columns from existing `date` fields
// Tables: Budget, StructureMillesime, StructureTypologie, AdresseTypologie, Cpom, CpomMillesime, CpomStructure
// Usage: yarn one-off 20251215-move-date-to-years

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const getYear = (date: Date | null | undefined): number | null => {
  if (!date) {
    return null;
  }
  return date.getUTCFullYear();
};

const changeDatesToYears = async () => {
  try {
    console.log("📥 Récupération des enregistrements à corriger...");

    const budgets = await prisma.budget.findMany({
      select: { id: true, date: true },
    });
    const structureMillesimes = await prisma.structureMillesime.findMany({
      select: { id: true, date: true },
    });
    const structureTypologies = await prisma.structureTypologie.findMany({
      select: { id: true, date: true },
    });
    const adresseTypologies = await prisma.adresseTypologie.findMany({
      select: { id: true, date: true },
    });
    const cpoms = await prisma.cpom.findMany({
      select: { id: true, debutCpom: true, finCpom: true },
    });
    const cpomMillesimes = await prisma.cpomMillesime.findMany({
      select: { id: true, date: true },
    });
    const cpomStructures = await prisma.cpomStructure.findMany({
      select: { id: true, dateDebut: true, dateFin: true },
    });

    console.log(
      `✓ Trouvé ${budgets.length} budgets, ${structureMillesimes.length} structureMillesimes, ${structureTypologies.length} structureTypologies, ${adresseTypologies.length} adresseTypologies, ${cpoms.length} cpoms, ${cpomMillesimes.length} cpomMillesimes, ${cpomStructures.length} cpomStructures`
    );

    let updated = 0;
    let errors = 0;

    const updateTable = async <T extends { id: number }>(
      items: T[],
      compute: (item: T) => Record<string, any> | null,
      updater: (id: number, data: Record<string, any>) => Promise<void>
    ) => {
      for (const item of items) {
        try {
          const data = compute(item);
          if (data) {
            await updater(item.id, data);
            updated += 1;
          }
        } catch (error) {
          errors += 1;
          console.error(`❌ Erreur pour id=${item.id}:`, error);
        }
      }
    };

    await updateTable(
      budgets,
      (budget) => {
        const year = getYear(budget.date);
        return year === null ? null : { year };
      },
      async (id, data) => {
        await prisma.budget.update({ where: { id }, data });
      }
    );

    await updateTable(
      structureMillesimes,
      (millesime) => {
        const year = getYear(millesime.date);
        return year === null ? null : { year };
      },
      async (id, data) => {
        await prisma.structureMillesime.update({ where: { id }, data });
      }
    );

    await updateTable(
      structureTypologies,
      (typologie) => {
        const year = getYear(typologie.date);
        return year === null ? null : { year };
      },
      async (id, data) => {
        await prisma.structureTypologie.update({ where: { id }, data });
      }
    );

    await updateTable(
      adresseTypologies,
      (typologie) => {
        const year = getYear(typologie.date);
        return year === null ? null : { year };
      },
      async (id, data) => {
        await prisma.adresseTypologie.update({ where: { id }, data });
      }
    );

    await updateTable(
      cpoms,
      (cpom) => {
        const yearStart = getYear(cpom.debutCpom);
        const yearEnd = getYear(cpom.finCpom);
        if (yearStart === null || yearEnd === null) {
          return null;
        }
        return { yearStart, yearEnd };
      },
      async (id, data) => {
        await prisma.cpom.update({ where: { id }, data });
      }
    );

    await updateTable(
      cpomMillesimes,
      (millesime) => {
        const year = getYear(millesime.date);
        return year === null ? null : { year };
      },
      async (id, data) => {
        await prisma.cpomMillesime.update({ where: { id }, data });
      }
    );

    await updateTable(
      cpomStructures,
      (cs) => {
        const yearStart = getYear(cs.dateDebut);
        const yearEnd = getYear(cs.dateFin);
        if (yearStart === null && yearEnd === null) {
          return null;
        }
        return {
          yearStart: yearStart ?? undefined,
          yearEnd: yearEnd ?? undefined,
        };
      },
      async (id, data) => {
        await prisma.cpomStructure.update({ where: { id }, data });
      }
    );

    console.log(
      `✅ Migration terminée. ${updated} enregistrements mis à jour${errors ? `, ${errors} erreurs` : ""}.`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la migration :", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

changeDatesToYears();
