// Remplit les métriques mensuelles dans le schéma reporting.
// Usage : yarn script fill-monthly-reporting

import "dotenv/config";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import type { Prisma } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

import {
  INDICATEURS_IMPACT,
  INDICATEURS_UTILES,
  REPORTING_QUALITY_INDICATOR_FIELDS,
  type ReportingQualityIndicatorField,
  sumIndicatorCounts,
} from "./reporting-indicator-categories";

const prisma = createPrismaClient();

const VISIT_SESSION_GAP_MINUTES = 30;

dayjs.extend(utc);

// Retourne les dates de début, fin et mois pour le reporting mensuel.
// Attention on met un threshold de 1j pour s'accorder avec le cron lancé j1 de m+1.
function getReportingWindow(now = new Date()): {
  start: Date;
  end: Date;
  month: Date;
} {
  const referenceDay = dayjs(now).utc().subtract(1, "day");
  const start = referenceDay.startOf("month");
  const end = start.add(1, "month");
  const month = start
    .endOf("month")
    .hour(12)
    .minute(0)
    .second(0)
    .millisecond(0);

  return { start: start.toDate(), end: end.toDate(), month: month.toDate() };
}
 
function countVisitsFromActions(
  actions: { userId: number; createdAt: Date }[]
): number {
  let visitsCount = 0;
  const lastSeenAtByUser = new Map<number, Date>();
  for (const action of actions) {
    const prev = lastSeenAtByUser.get(action.userId);
    if (!prev) {
      visitsCount++;
      lastSeenAtByUser.set(action.userId, action.createdAt);
      continue;
    }

    if (dayjs(action.createdAt).diff(dayjs(prev), "minute") > VISIT_SESSION_GAP_MINUTES) {
      visitsCount++;
    }
    lastSeenAtByUser.set(action.userId, action.createdAt);
  }
  return visitsCount;
}

async function main() {
  const now = new Date();
  if (dayjs(now).utc().date() !== 1) {
    console.log(
      "⏭️  Script ignoré: le reporting mensuel ne s'exécute que le 1er du mois (UTC)."
    );
    return;
  }

  const { start, end, month } = getReportingWindow(now);
  console.log(`📊 Remplissage reporting mensuel: ${month.toISOString()}`);

  try {
    // Snapshot de la qualité
    const structuresCount = await prisma.structuresGlobalQuality.count();
    const issuesAgg = await prisma.structuresGlobalQuality.aggregate({
      _sum: { issuesCount: true },
    });
    const issuesCountSum = issuesAgg._sum.issuesCount ?? 0;

    const indicatorFields = REPORTING_QUALITY_INDICATOR_FIELDS;

    type IndicatorField = ReportingQualityIndicatorField;

    const whereTrue = (
      field: IndicatorField
    ): Prisma.StructuresGlobalQualityWhereInput =>
      ({
        [field]: true,
      }) as unknown as Prisma.StructuresGlobalQualityWhereInput;

    const indicatorCountsEntries = await Promise.all(
      indicatorFields.map(async (field) => {
        const count = await prisma.structuresGlobalQuality.count({
          where: whereTrue(field),
        });
        return [field, count] as const;
      })
    );

    const indicatorsCount = indicatorFields.length;

    const indicatorCounts = Object.fromEntries(
      indicatorCountsEntries
    ) as Record<IndicatorField, number>;

    const indicateursUtilesCount = sumIndicatorCounts(
      indicatorCounts,
      INDICATEURS_UTILES
    );
    const indicateursImpactCount = sumIndicatorCounts(
      indicatorCounts,
      INDICATEURS_IMPACT
    );

    await prisma.monthlyStructuresGlobalQualityCount.upsert({
      where: { month },
      create: {
        month,
        structuresCount,
        indicatorsCount,
        issuesCountSum,
        indicateursUtilesCount,
        indicateursImpactCount,
        ...indicatorCounts,
      },
      update: {
        structuresCount,
        indicatorsCount,
        issuesCountSum,
        indicateursUtilesCount,
        indicateursImpactCount,
        ...indicatorCounts,
      },
    });

    // Snapshot de l'usage
    const actions = await prisma.userAction.findMany({
      where: {
        createdAt: { gte: start, lt: end },
      },
      select: { userId: true, createdAt: true },
      orderBy: [{ userId: "asc" }, { createdAt: "asc" }],
    });

    const visitsCount = countVisitsFromActions(actions);

    const readsCount = await prisma.userAction.count({
      where: {
        action: "READ",
        createdAt: { gte: start, lt: end },
      },
    });

    const updatesCount = await prisma.userAction.count({
      where: {
        action: "UPDATE",
        createdAt: { gte: start, lt: end },
      },
    });

    const structuresUpdatedCount = await prisma.structure.count({
      where: { updatedAt: { gte: start, lt: end } },
    });

    await prisma.monthlyReportingMetric.upsert({
      where: { month },
      create: {
        month,
        visitsCount,
        readsCount,
        updatesCount,
        structuresUpdatedCount,
      },
      update: {
        visitsCount,
        readsCount,
        updatesCount,
        structuresUpdatedCount,
      },
    });

    const departements = await prisma.departement.findMany({
      select: {
        numero: true,
        regionAdministrative: { select: { id: true, name: true } },
      },
    });
    const regionByDeptNumero = new Map(
      departements.map((departement) => [
        departement.numero,
        departement.regionAdministrative,
      ])
    );

    const structureActions = await prisma.userAction.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        structureId: { not: null },
      },
      select: {
        userId: true,
        createdAt: true,
        structure: {
          select: { departementAdministratif: true },
        },
      },
      orderBy: [{ userId: "asc" }, { createdAt: "asc" }],
    });

    const actionsByRegionId = new Map<
      number,
      { regionName: string; actions: { userId: number; createdAt: Date }[] }
    >();

    for (const action of structureActions) {
      const deptNumero = action.structure?.departementAdministratif;
      if (!deptNumero) {
        continue;
      }
      const region = regionByDeptNumero.get(deptNumero);
      if (!region?.id) {
        continue;
      }

      const bucket = actionsByRegionId.get(region.id) ?? {
        regionName: region.name,
        actions: [],
      };
      bucket.actions.push({
        userId: action.userId,
        createdAt: action.createdAt,
      });
      actionsByRegionId.set(region.id, bucket);
    }

    for (const [regionId, { regionName, actions: regionActions }] of actionsByRegionId) {
      const regionalVisitsCount = countVisitsFromActions(regionActions);
      await prisma.monthlyReportingVisitsByRegion.upsert({
        where: {
          month_regionId: { month, regionId },
        },
        create: {
          month,
          regionId,
          regionName,
          visitsCount: regionalVisitsCount,
        },
        update: {
          regionName,
          visitsCount: regionalVisitsCount,
        },
      });
    }

    // Snapshot du support
    await prisma.monthlySupportContact.upsert({
      where: { month },
      create: {
        month,
        phoneCallsCount: null,
        emailsCount: null,
        notes: null,
      },
      update: {},
    });

    console.log("✅ Reporting mensuel mis à jour.");
  } catch (error) {
    console.error("❌ Erreur lors du remplissage du reporting mensuel", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
