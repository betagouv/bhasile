"use client";

import { useSearchParams } from "next/navigation";

import { usePdfExport } from "@/app/hooks/usePdfExport";
import { formatDate } from "@/app/utils/date.util";
import { getPdfExportPayload } from "@/app/utils/pdf-export.util";
import { useOptionalStatistiquesContext } from "@/contexts/StatistiquesContext";
import { pickFilters } from "@/utils/filters.util";

export const useStatistiquesPdfExport = () => {
  const { statistiques } = useOptionalStatistiquesContext();
  const searchParams = useSearchParams();

  const { triggerExport, isExporting, printRef } = usePdfExport(
    `Statistiques ${formatDate(new Date())}`
  );

  const filters = pickFilters(searchParams);

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
    departements: filters.get("departements"),
    operateurs: filters.get("operateurs"),
    types: filters.get("types"),
  };
};
