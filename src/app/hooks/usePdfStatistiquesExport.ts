"use client";

import { useSearchParams } from "next/navigation";

import { usePdfExport } from "@/app/hooks/usePdfExport";
import { formatDate } from "@/app/utils/date.util";
import { computeStartMonth, toYearMonth } from "@/app/utils/pdf-export.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

export const useStatistiquesPdfExport = () => {
  const { statistiques } = useStatistiquesContext();
  const searchParams = useSearchParams();

  const { triggerExport, isExporting, printRef } = usePdfExport(
    `Statistiques ${formatDate(new Date())}`
  );

  const departements =
    typeof searchParams.get("departements") === "string"
      ? searchParams.get("departements")
      : undefined;
  const operateurs =
    typeof searchParams.get("operateurs") === "string"
      ? searchParams.get("operateurs")
      : undefined;
  const types =
    typeof searchParams.get("types") === "string"
      ? searchParams.get("types")
      : undefined;

  const typePlacesLastYear =
    statistiques.places.byYear?.[statistiques.places.byYear.length - 1]?.year ||
    0;
  const financeLastYear =
    statistiques.finance.byYear?.[statistiques.finance.byYear.length - 1]
      ?.year || 0;
  const latestDataYear = Math.max(typePlacesLastYear, financeLastYear);

  const endYear = latestDataYear || new Date().getFullYear();
  const startYear = endYear - 4;

  const latestActivityDate = statistiques.activite.byMonth?.length
    ? new Date(
        Math.max(
          ...statistiques.activite.byMonth.map((activite) =>
            new Date(activite.date).getTime()
          )
        )
      )
    : new Date();

  const endMonth = toYearMonth(latestActivityDate);
  const startMonth = computeStartMonth(endMonth);

  const exportPayload = {
    typePlacesFinancesStartYear: startYear,
    typePlacesFinancesEndYear: endYear,
    activiteStartMonth: startMonth,
    activiteEndMonth: endMonth,
  };

  return {
    triggerExport,
    isExporting,
    printRef,
    exportPayload,
    departements,
    operateurs,
    types,
  };
};
