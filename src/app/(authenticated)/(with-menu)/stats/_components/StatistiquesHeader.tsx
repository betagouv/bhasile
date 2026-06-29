"use client";

import { ReactElement } from "react";

import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { useHideOnScroll } from "@/app/hooks/useHideOnScroll";

import { HeaderFilters } from "../../../../components/header-filters/HeaderFilters";
import { useStatistiquesContext } from "../_context/StatistiquesClientContext";

export const StatistiquesHeader = (): ReactElement | null => {
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
          <h2 className="text-title-blue-france fr-h5 mr-4 mb-0">
            Statistiques
          </h2>
          <HeaderFilters />
        </div>
      </div>
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
    </div>
  ) : null;
};
