"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactElement } from "react";

import { hasOpenActualisation } from "@/app/api/structures/actualisation.util";
import { Badge } from "@/app/components/common/Badge";
import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { useHideOnScroll } from "@/app/hooks/useHideOnScroll";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ActualisationHeader } from "./ActualisationHeader";
import { FinalisationHeader } from "./FinalisationHeader";
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
    hasOpenActualisation(structure.campaigns, actualisationYear);

  const { headerRef } = useHeaderHeight();
  const { isHidden } = useHideOnScroll();

  const pathname = usePathname();
  const isRootPath = pathname === `/structures/${structure?.id}`;

  const {
    codeBhasile,
    type,
    operateurLabel,
    nom,
    communeAdministrative,
    departementAdministratif,
  } = structure;

  return (
    <>
      <div
        className="sticky top-0 z-50 bg-lifted-grey shadow-sm"
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
          <div>
            <h2 className="text-title-blue-france text-xs uppercase mb-0">
              <strong className="pr-3">Structure hébergement</strong>
            </h2>
            <h3 className="text-title-blue-france fr-h6 mb-0 flex items-center gap-4">
              <span className="flex items-center gap-2">
                <strong>{codeBhasile}</strong>
                {nom ? (
                  <>
                    –
                    <span className="mb-0 text-title-grey text-lg italic font-normal">
                      {nom}
                    </span>
                  </>
                ) : null}
              </span>
              <span className="flex items-center gap-2">
                <Badge type="purple">{type}</Badge>{" "}
                <Badge type="purple">{operateurLabel}</Badge>{" "}
                <Badge type="purple">
                  {communeAdministrative} ({departementAdministratif})
                </Badge>
              </span>
            </h3>
          </div>
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
            {isRootPath && !isStructureFinalisee && <FinalisationHeader />}
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
