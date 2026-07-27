"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement } from "react";

import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { HeaderFilters } from "@/app/components/header-filters/HeaderFilters";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { useHideOnScroll } from "@/app/hooks/useHideOnScroll";

import { useStatistiquesContext } from "../_context/StatistiquesClientContext";

export const StatistiquesHeader = ({
  visualization,
  setVisualization,
}: Props): ReactElement | null => {
  const { statistiques } = useStatistiquesContext();

  const { headerRef } = useHeaderHeight();
  const { isHidden } = useHideOnScroll();

  return statistiques ? (
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
                    onChange: () => setVisualization("tableaux"),
                  },
                },
                {
                  iconId: "fr-icon-road-map-line",
                  label: "Cartographie",
                  nativeInputProps: {
                    value: "cartographie",
                    checked: visualization === "cartographie",
                    onChange: () => setVisualization("cartographie"),
                  },
                },
              ]}
            />
          </div>
          <HeaderFilters />
        </div>
      </div>
      {visualization === "tableaux" && (
        <NavigationMenu
          menuElements={[
            {
              label: "Structures",
              section: "#structures",
            },
            {
              label: "Types de places",
              section: "#types-places",
            },
            {
              label: "Finance",
              section: "#finance",
            },
            {
              label: "Contrôle qualité",
              section: "#controle-qualite",
            },
            {
              label: "Activité",
              section: "#activite",
            },
            {
              label: "RMU",
              section: "#rmu",
            },
          ]}
        />
      )}
    </div>
  ) : null;
};

type Props = {
  visualization: "tableaux" | "cartographie";
  setVisualization: (visualization: "tableaux" | "cartographie") => void;
};
