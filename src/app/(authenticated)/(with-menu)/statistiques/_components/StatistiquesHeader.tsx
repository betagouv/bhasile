"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { HeaderFilters } from "@/app/components/header-filters/HeaderFilters";
import { useButtonsPanel } from "@/app/hooks/useButtonsPanel";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { useHideOnScroll } from "@/app/hooks/useHideOnScroll";
import { downloadDocument } from "@/app/utils/spreadsheet-download/spreadsheet-download.util";
import { getStatistiquesDownloadContent } from "@/app/utils/spreadsheet-download/statistiques-spreadsheet-download.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

export const StatistiquesHeader = (): ReactElement | null => {
  const { headerRef } = useHeaderHeight();
  const { isHidden } = useHideOnScroll();
  const { isPanelOpen, setIsPanelOpen, panelRef } = useButtonsPanel();
  const { statistiques } = useStatistiquesContext();

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  return (
    <div
      className={`sticky top-0 z-50 bg-lifted-grey transition-transform duration-300 ease-in-out ${
        isHidden ? "-translate-y-full" : "translate-y-0"
      }`}
      ref={headerRef}
    >
      <div className="flex gap-2 pl-6 border-b border-b-border-default-grey min-h-[4.35rem] justify-between items-center sticky top-0 bg-lifted-grey z-10">
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center">
            <h2 className="text-title-blue-france fr-h5 mb-0 pr-4">
              Statistiques
            </h2>
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
          </div>
          <div className="relative shrink-0" ref={panelRef}>
            <Button
              priority="tertiary no outline"
              iconId="ri-more-2-fill"
              title="Menu statistiques"
              onClick={() => {
                setIsPanelOpen(!isPanelOpen);
              }}
            />
            {isPanelOpen && (
              <div className="absolute top-full right-0 flex flex-col items-end bg-white shadow-md z-50">
                <Button
                  priority="tertiary no outline"
                  onClick={() => {
                    downloadDocument(
                      getStatistiquesDownloadContent(
                        statistiques,
                        searchParams.size !== 0
                      )
                    );
                  }}
                  className="whitespace-nowrap"
                >
                  Exporter tous les tableaux (ODS)
                </Button>
              </div>
            )}
          </div>
          <HeaderFilters />
        </div>
      </div>
      {visualization === "tableaux" && (
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
    </div>
  );
};
