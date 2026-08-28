"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactElement } from "react";

import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { useHideOnScroll } from "@/app/hooks/useHideOnScroll";
import { hasOpenActualisation } from "@/app/utils/actualisationForm.util";
import { cn } from "@/app/utils/classname.util";
import { useStructureContext } from "@/contexts/StructureContext";

import { ActualisationHeader } from "./ActualisationHeader";
import { FinalisationHeader } from "./FinalisationHeader";
import { HeaderMainContent } from "./HeaderMainContent";
import { StructureHeaderActions } from "./StructureHeaderActions";
import { StructureHeaderModals } from "./StructureHeaderModals";

export const StructureHeader = ({
  actualisationYear,
}: {
  actualisationYear: number | null;
}): ReactElement | null => {
  const { structure } = useStructureContext();
  const isStructureFinalisee = structure.isFinalised;

  const showActualisation =
    actualisationYear !== null &&
    structure.isFinalised &&
    !structure.isClosed &&
    hasOpenActualisation(structure.forms, actualisationYear);

  const { headerRef } = useHeaderHeight();
  const { isHidden } = useHideOnScroll();

  const pathname = usePathname();
  const isRootPath = pathname === `/structures/${structure?.id}`;

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-50 shadow-sm",
          structure.isClosed ? "bg-contrast-grey" : "bg-lifted-grey"
        )}
        ref={headerRef}
      >
        <div className="flex border-b border-b-border-default-grey px-6 py-3 items-center relative z-20">
          <Link
            href="/structures"
            className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-s-line"
            title="Retour"
          >
            Retour
          </Link>
          <HeaderMainContent />
          <div className="grow" />
          <StructureHeaderActions actualisationYear={actualisationYear} />
        </div>

        <div
          className={`grid transition-all duration-300 ease-in-out relative z-10 ${
            isHidden
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-auto"
          }`}
          style={{
            gridTemplateRows: isHidden ? "0fr" : "1fr",
          }}
        >
          <div className="overflow-hidden">
            {isRootPath && (
              <NavigationMenu
                menuElements={[
                  { label: "Description", section: "#description" },
                  { label: "Calendrier", section: "#calendrier" },
                  { label: "Type de places", section: "#places" },
                  {
                    label: "Finances",
                    section: "#finances",
                    isDisplayed:
                      !!structure.budgets && structure.budgets?.length > 0,
                  },
                  { label: "Contrôle qualité", section: "#controle" },
                  { label: "Activité", section: "#activite" },
                  {
                    label: "Actes administratifs",
                    section: "#actes-administratifs",
                  },
                  { label: "Notes", section: "#notes" },
                ]}
              />
            )}
            {isRootPath && !isStructureFinalisee && !structure.isClosed && (
              <FinalisationHeader />
            )}
            {isRootPath && showActualisation && actualisationYear && (
              <ActualisationHeader actualisationYear={actualisationYear} />
            )}
          </div>
        </div>
      </div>

      <StructureHeaderModals structureId={structure.id} />
    </>
  );
};
