// Remplit les métriques mensuelles dans le schéma reporting.
// Usage : yarn script fill-monthly-reporting

import "dotenv/config";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import type { Prisma } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

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

async function main() {
  const { start, end, month } = getReportingWindow();
  console.log(`📊 Remplissage reporting mensuel: ${month.toISOString()}`);

  try {
    // Snapshot de la qualité
    const structuresCount = await prisma.structuresGlobalQuality.count();
    const issuesAgg = await prisma.structuresGlobalQuality.aggregate({
      _sum: { issuesCount: true },
    });
    const issuesCountSum = issuesAgg._sum.issuesCount ?? 0;

    const indicatorFields = [
      "has_issue_authorisation_dates_undefined",
      "has_issue_authorisation_period_not_15y",
      "has_issue_convention_dates_undefined",
      "has_issue_authorized_convention_not_5y",
      "has_issue_authorized_convention_outside_authorisation_period",
      "has_issue_authorized_convention_missing_or_expired",
      "has_issue_evaluation_not_done_in_time",
      "has_issue_subsidized_convention_gt_3y",
      "has_issue_specific_places_gt_places_autorisees",
      "has_issue_places_structure_vs_address_diff_gt_10pct",
      "has_issue_dept_code",
      "has_issue_multi_dna",
      "has_issue_cpom_mono_structure",
      "has_issue_taux_encadrement_max_gt_25",
      "has_issue_taux_encadrement_min_eq_0",
      "has_issue_cout_journalier_max_gt_35",
      "has_issue_cout_journalier_min_lt_15",
      "has_issue_resultat_net_eq_0",
      "has_issue_authorized_affectations_breakdown_missing",
      "has_issue_authorized_reprise_plus_affectations_mismatch",
      "has_issue_subsidized_deficit_nonzero_boxes",
      "has_issue_subsidized_excedent_rules",
      "has_issue_excedent_left_in_report_a_nouveau",
    ] as const;

    type IndicatorField = (typeof indicatorFields)[number];

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

    await prisma.monthlyStructuresGlobalQualityCount.upsert({
      where: { month },
      create: {
        month,
        structuresCount,
        indicatorsCount,
        issuesCountSum,
        ...indicatorCounts,
      },
      update: {
        structuresCount,
        indicatorsCount,
        issuesCountSum,
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

    let visitsCount = 0;
    const lastSeenAtByUser = new Map<number, Date>();
    for (const action of actions) {
      const prev = lastSeenAtByUser.get(action.userId);
      if (!prev) {
        visitsCount++;
        lastSeenAtByUser.set(action.userId, action.createdAt);
        continue;
      }

      if (dayjs(action.createdAt).diff(dayjs(prev), "minute") > 30) {
        visitsCount++;
      }
      lastSeenAtByUser.set(action.userId, action.createdAt);
    }

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
