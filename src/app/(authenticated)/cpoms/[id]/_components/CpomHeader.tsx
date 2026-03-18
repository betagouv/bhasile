"use client";

import { usePathname } from "next/navigation";
import { ReactElement } from "react";

import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { computeCpomDates, formatCpomName } from "@/app/utils/cpom.util";
import { getYearFromDate } from "@/app/utils/date.util";

import { useCpomContext } from "../_context/CpomClientContext";

export const CpomHeader = (): ReactElement | null => {
  const { cpom } = useCpomContext();

  const { headerRef } = useHeaderHeight();

  const pathname = usePathname();
  const isRootPath = pathname === `/cpoms/${cpom?.id}`;
  const isModificationPath = pathname.includes("modification");
  const isAjoutPath = pathname.includes("ajout");

  const { dateStart, dateEnd } = computeCpomDates(cpom);

  return cpom ? (
    <div className="sticky top-0 z-2 bg-lifted-grey" ref={headerRef}>
      <div className="flex border-b border-b-border-default-grey px-6 py-3 items-center">
        <div>
          <h2 className="text-title-blue-france text-xs uppercase mb-0">
            <strong className="pr-3">
              {getCpomTitle(isModificationPath, isAjoutPath)}
            </strong>
          </h2>
          <h3 className="text-title-blue-france fr-h6 mb-0">
            <strong className="pr-2">{formatCpomName(cpom)}</strong>{" "}
            {dateStart && dateEnd && (
              <span className="text-title-grey font-normal text-lg italic">
                {getYearFromDate(dateStart)} - {getYearFromDate(dateEnd)}
              </span>
            )}
          </h3>
        </div>
      </div>
      {isRootPath && (
        <NavigationMenu
          menuElements={[
            {
              label: "Description",
              section: "#description",
              isDisplayed: true,
            },
            {
              label: "Composition",
              section: "#composition",
              isDisplayed: true,
            },
            { label: "Finances", section: "#finances", isDisplayed: true },
            {
              label: "Actes administratifs",
              section: "#actes-administratifs",
              isDisplayed: true,
            },
          ]}
        />
      )}
    </div>
  ) : null;
};

const getCpomTitle = (
  isModificationPath: boolean,
  isAjoutPath: boolean
): string => {
  if (isModificationPath) {
    return "Modifier un CPOM";
  }
  if (isAjoutPath) {
    return "Ajouter un CPOM";
  }
  return "CPOM";
};
