"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { useHideOnScroll } from "@/app/hooks/useHideOnScroll";
import { useOperateurContext } from "@/contexts/OperateurContext";

export const OperateurHeader = (): ReactElement | null => {
  const { operateur } = useOperateurContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { headerRef } = useHeaderHeight();
  const { isHidden } = useHideOnScroll();

  const isRootPath = pathname === `/operateurs/${operateur?.id}`;

  const params = new URLSearchParams();
  const page = searchParams.get("page");
  const search = searchParams.get("search");

  if (page) {
    params.set("page", page);
  }
  if (search) {
    params.set("search", search);
  }

  const queryString = params.toString();
  const backHref = `/operateurs${queryString ? `?${queryString}` : ""}`;

  return operateur ? (
    <div
      className={`sticky top-0 z-50 bg-lifted-grey transition-transform duration-300 ease-in-out ${
        isHidden ? "-translate-y-full" : "translate-y-0"
      }`}
      ref={headerRef}
    >
      <div className="flex border-b border-b-border-default-grey px-6 py-3 items-center">
        <Link
          className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-s-line"
          title="Retour à la liste des opérateurs"
          href={backHref}
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
            },
            {
              label: "Contacts",
              section: "#contacts",
            },
            {
              label: "Documents",
              section: "#documents",
            },
          ]}
        />
      )}
    </div>
  ) : null;
};
