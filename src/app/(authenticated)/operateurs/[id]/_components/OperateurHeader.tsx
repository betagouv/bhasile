"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactElement } from "react";

import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";

import { useOperateurContext } from "../_context/OperateurClientContext";

export const OperateurHeader = (): ReactElement | null => {
  const { operateur } = useOperateurContext();
  const pathname = usePathname();

  const { headerRef } = useHeaderHeight();

  const isRootPath = pathname === `/operateurs/${operateur?.id}`;

  return operateur ? (
    <div className="sticky top-0 z-2 bg-lifted-grey" ref={headerRef}>
      <div className="flex border-b border-b-border-default-grey px-6 py-3 items-center">
        <Link
          className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-s-line"
          title="Retour"
          href="/operateurs"
        >
          Retour
        </Link>
        <div>
          <h2 className="text-title-blue-france text-xs uppercase mb-0">
            <strong className="pr-3">Opérateur</strong>
          </h2>
          <h3 className="text-title-blue-france fr-h6 mb-0">
            <strong className="pr-2">{operateur.name}</strong>{" "}
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
              label: "Documents",
              section: "#documents",
              isDisplayed: true,
            },
          ]}
        />
      )}
    </div>
  ) : null;
};
