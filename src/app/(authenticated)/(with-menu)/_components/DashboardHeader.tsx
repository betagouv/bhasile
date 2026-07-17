"use client";

import { ReactElement } from "react";

import { HeaderFilters } from "@/app/components/header-filters/HeaderFilters";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { useHideOnScroll } from "@/app/hooks/useHideOnScroll";

type Props = {
  prenom?: string;
};

export const DashboardHeader = ({ prenom }: Props): ReactElement => {
  const { headerRef } = useHeaderHeight();
  const { isHidden } = useHideOnScroll();

  return (
    <div
      className={`sticky top-0 z-50 bg-lifted-grey transition-transform duration-300 ease-in-out ${
        isHidden ? "-translate-y-full" : "translate-y-0"
      }`}
      ref={headerRef}
    >
      <div className="flex gap-2 pl-6 border-b border-b-border-default-grey min-h-[4.35rem] justify-between items-center sticky top-0 bg-lifted-grey z-10">
        <div className="flex justify-between w-full items-center">
          <h2 className="text-title-blue-france fr-h5 mr-4 mb-0">
            Bienvenue{prenom ? ` ${prenom}` : ""}
          </h2>
          <HeaderFilters />
        </div>
      </div>
    </div>
  );
};
