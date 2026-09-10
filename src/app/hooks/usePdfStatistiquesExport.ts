"use client";

import { useSearchParams } from "next/navigation";

import { usePdfExport } from "@/app/hooks/usePdfExport";
import { formatDate } from "@/app/utils/date.util";
import { getPdfExportPayload } from "@/app/utils/pdf-export.util";
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

  const exportPayload = getPdfExportPayload({
    typePlacesYears: statistiques?.places?.byYear?.map((place) => place.year),
    financeYears: statistiques?.finance?.byYear?.map((finance) => finance.year),
    activiteDates: statistiques?.activite?.byMonth?.map(
      (activite) => activite.date
    ),
  });

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
