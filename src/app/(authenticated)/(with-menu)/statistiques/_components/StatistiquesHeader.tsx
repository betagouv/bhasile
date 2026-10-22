"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { PrintableContainer } from "@/app/components/PrintableContainer";
import { useStatistiquesPdfExport } from "@/app/hooks/useStatistiquesPdfExport";
import { useUserAction } from "@/app/hooks/useUserAction";
import { downloadDocument } from "@/app/utils/spreadsheet-download/spreadsheet-download.util";
import { getStatistiquesDownloadContent } from "@/app/utils/spreadsheet-download/statistiques-spreadsheet-download.util";
import { PageHeader } from "@/components/PageHeader";
import { useOptionalStatistiquesContext } from "@/contexts/StatistiquesContext";

import { StatistiquesPdfExportDocument } from "./StatistiquesPdfExportDocument";

export const StatistiquesHeader = (): ReactElement => {
  const { statistiques } = useOptionalStatistiquesContext();
  const { trackStatistiquesSpreadsheetExport, trackStatistiquesPdfExport } =
    useUserAction();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    triggerExport,
    isExporting,
    printRef,
    exportPayload,
    departements,
    operateurs,
    types,
  } = useStatistiquesPdfExport();

  const isCartographie = pathname.includes("cartographie");
  const visualization = isCartographie ? "cartographie" : "tableaux";

  const handleVisualizationChange = (
    newVisualization: "tableaux" | "cartographie"
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newVisualization === "tableaux") {
      ["granularite", "indicateur", "annee", "region"].forEach((key) =>
        params.delete(key)
      );
    }

    const query = params.toString();
    const suffix = query ? `?${query}` : "";
    const path =
      newVisualization === "tableaux"
        ? "/statistiques"
        : "/statistiques/cartographie";

    router.push(`${path}${suffix}`);
  };

  const jsonSearchParams = Object.fromEntries(
    new URLSearchParams(searchParams)
  );

  return (
    <PageHeader
      title="Statistiques"
      isSingleZone={isCartographie}
      tabs={
        <SegmentedControl
          small
          legend=""
          inlineLegend
          className="[&_div]:ml-0"
          segments={[
            {
              iconId: "fr-icon-layout-line",
              label: "Tableaux et graphiques",
              nativeInputProps: {
                value: "tableaux",
                checked: visualization === "tableaux",
                onChange: () => handleVisualizationChange("tableaux"),
              },
            },
            {
              iconId: "fr-icon-road-map-line",
              label: "Cartographie",
              nativeInputProps: {
                value: "cartographie",
                checked: visualization === "cartographie",
                onChange: () => handleVisualizationChange("cartographie"),
              },
            },
          ]}
        />
      }
      menuActions={
        statistiques
          ? [
              {
                label: "Exporter la fiche (PDF)",
                onClick: () => {
                  triggerExport();
                  trackStatistiquesPdfExport(jsonSearchParams);
                },
              },
              {
                label: "Exporter tous les tableaux (ODS)",
                onClick: () => {
                  downloadDocument(
                    getStatistiquesDownloadContent(
                      statistiques,
                      searchParams.size !== 0
                    )
                  );
                  trackStatistiquesSpreadsheetExport(jsonSearchParams);
                },
              },
            ]
          : []
      }
    >
      {statistiques && visualization === "tableaux" && (
        <NavigationMenu
          menuElements={[
            { label: "Structures", section: "#structures" },
            { label: "Types de places", section: "#types-places" },
            { label: "Finance", section: "#finance" },
            { label: "Contrôle qualité", section: "#controle-qualite" },
            { label: "Activité", section: "#activite" },
            { label: "RMU", section: "#rmu" },
          ]}
        />
      )}

      {statistiques && (
        <PrintableContainer isExporting={isExporting} printRef={printRef}>
          <StatistiquesPdfExportDocument
            data={exportPayload}
            departements={departements}
            operateurs={operateurs}
            types={types}
          />
        </PrintableContainer>
      )}
    </PageHeader>
  );
};
