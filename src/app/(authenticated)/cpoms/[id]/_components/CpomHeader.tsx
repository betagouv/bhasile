"use client";

import { usePathname } from "next/navigation";
import { ReactElement } from "react";

import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { computeCpomDates, formatCpomName } from "@/app/utils/cpom.util";
import { getYearFromDate } from "@/app/utils/date.util";

import { useCpomContext } from "../_context/CpomClientContext";
import { CpomNavigationMenu } from "./CpomNavigationMenu";

export const CpomHeader = (): ReactElement | null => {
  const { cpom } = useCpomContext();

  const { headerRef } = useHeaderHeight();

  const pathname = usePathname();
  const isRootPath = pathname === `/cpoms/${cpom?.id}`;
  const isModificationPath = pathname.includes("modification");
  const isAjoutPath = pathname.includes("ajout");

  const years = `${getYearFromDate(computeCpomDates(cpom).dateStart)} - ${getYearFromDate(computeCpomDates(cpom).dateEnd)}`;

  return cpom ? (
    <div className="sticky top-0 z-2 bg-lifted-grey" ref={headerRef}>
      <div className="flex border-b border-b-border-default-grey px-6 py-3 items-center">
        <div>
          <h2 className="text-title-blue-france text-xs uppercase mb-0">
            <strong className="pr-3">
              {isModificationPath
                ? "Modifier un CPOM"
                : isAjoutPath
                  ? "Ajouter un CPOM"
                  : "CPOM"}
            </strong>
          </h2>
          <h3 className="text-title-blue-france fr-h6 mb-0">
            <strong className="pr-2">{formatCpomName(cpom)}</strong>{" "}
            <span className="text-title-grey font-normal text-lg italic">
              {years}
            </span>
          </h3>
        </div>
      </div>
      {isRootPath && <CpomNavigationMenu />}
    </div>
  ) : null;
};
