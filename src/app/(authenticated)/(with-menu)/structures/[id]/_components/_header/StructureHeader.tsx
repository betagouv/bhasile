"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { UpcomingTransformationBadge } from "@/app/components/structures/UpcomingTransformationBadge";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { useHideOnScroll } from "@/app/hooks/useHideOnScroll";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ActualisationHeader } from "./ActualisationHeader";
import { AutoSaveStatus } from "./AutoSaveStatus";
import { FinalisationHeader } from "./FinalisationHeader";
import { StructureMenu } from "./StructureMenu";

const autoSaveModal = createModal({
  id: "autosave-modal",
  isOpenedByDefault: false,
});
const finalisationSuccessModal = createModal({
  id: "finalisation-success-modal",
  isOpenedByDefault: false,
});

export const StructureHeader = ({
  actualisationYear,
  showActualisation,
}: {
  actualisationYear: number | null;
  showActualisation: boolean;
}): ReactElement | null => {
  const { structure } = useStructureContext();
  const isStructureFinalisee = structure.isFinalised;
  const router = useRouter();

  const { handleFinalisation, isStructureReadyToFinalise } =
    useAgentFormHandling();

  const { headerRef } = useHeaderHeight();
  const { isHidden } = useHideOnScroll();

  const pathname = usePathname();

  const isRootPath = pathname === `/structures/${structure?.id}`;
  const isFinalisationPath = pathname.startsWith(
    `/structures/${structure?.id}/finalisation`
  );

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
          {isFinalisationPath ? (
            <div className="flex items-center gap-3">
              <AutoSaveStatus onStatusClick={() => autoSaveModal.open()} />
              <Button
                disabled={!isStructureReadyToFinalise}
                onClick={async () => {
                  if (await handleFinalisation()) {
                    finalisationSuccessModal.open();
                  }
                }}
              >
                Finaliser la création
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {structure.upcomingTransformations?.map((transformation) => (
                <UpcomingTransformationBadge
                  key={`${transformation.kind}-${transformation.date}`}
                  transformation={transformation}
                />
              ))}
              <StructureMenu structureId={structure.id} />
            </div>
          )}
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
                  {
                    label: "Description",
                    section: "#description",
                  },
                  {
                    label: "Calendrier",
                    section: "#calendrier",
                  },
                  {
                    label: "Type de places",
                    section: "#places",
                  },
                  {
                    label: "Finances",
                    section: "#finances",
                    isDisplayed:
                      !!structure.budgets && structure.budgets?.length > 0,
                  },
                  {
                    label: "Contrôle qualité",
                    section: "#controle",
                  },
                  {
                    label: "Activité",
                    section: "#activite",
                  },
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

      <autoSaveModal.Component
        title="Votre progression est enregistrée automatiquement"
        buttons={[
          { doClosesModal: true, children: "J’ai compris", type: "button" },
        ]}
      >
        <p>
          Aucune action n’est requise de votre part pour enregistrer les données
          que vous avez saisies.
        </p>
      </autoSaveModal.Component>

      <finalisationSuccessModal.Component
        title="Vous avez terminé la création de cette structure !"
        buttons={[
          {
            doClosesModal: true,
            children: "J’ai compris",
            type: "button",
            onClick: () => {
              router.push(`/structures/${structure?.id}`);
            },
          },
        ]}
      >
        <p>
          Les données ont bien été enregistrées. Merci pour votre contribution
          qui va rendre l’outil plus précis.
        </p>
      </finalisationSuccessModal.Component>
    </>
  );
};
