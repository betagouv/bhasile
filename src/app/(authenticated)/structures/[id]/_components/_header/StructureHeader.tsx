"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactElement } from "react";

import { NavigationMenu } from "@/app/components/common/NavigationMenu";
import { useAgentFormHandling } from "@/app/hooks/useAgentFormHandling";
import { useHeaderHeight } from "@/app/hooks/useHeaderHeight";
import { getFinalisationFormStatus } from "@/app/utils/finalisationForm.util";
import { getOperateurLabel } from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { AutoSaveStatus } from "./AutoSaveStatus";
import { FinalisationHeader } from "./FinalisationHeader";

const autoSaveModal = createModal({
  id: "autosave-modal",
  isOpenedByDefault: false,
});
const finalisationSuccessModal = createModal({
  id: "finalisation-success-modal",
  isOpenedByDefault: false,
});

export const StructureHeader = (): ReactElement | null => {
  const { structure } = useStructureContext();

  const isStructureFinalisee = getFinalisationFormStatus(structure);

  const router = useRouter();

  const { handleFinalisation, isStructureReadyToFinalise } =
    useAgentFormHandling();

  const { headerRef } = useHeaderHeight();

  const pathname = usePathname();

  const isRootPath = pathname === `/structures/${structure?.id}`;
  const isFinalisationPath = pathname.startsWith(
    `/structures/${structure?.id}/finalisation`
  );

  const {
    type,
    filiale,
    operateur,
    structureTypologies,
    nom,
    communeAdministrative,
    departementAdministratif,
  } = structure;

  return structure ? (
    <>
      <div className="sticky top-0 z-2 bg-lifted-grey" ref={headerRef}>
        <div className="flex border-b border-b-border-default-grey px-6 py-3 items-center">
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
            <h3 className="text-title-blue-france fr-h6 mb-0">
              <strong className="pr-2">
                {type}, {getOperateurLabel(filiale, operateur?.name)},{" "}
                {structureTypologies?.[0]?.placesAutorisees} places
              </strong>
              <span className="pr-2">{" – "}</span>
              <span className="mb-0 text-title-grey fr-text--lg italic font-normal">
                {nom ? `${nom}, ` : ""} {communeAdministrative},{" "}
                {departementAdministratif}
              </span>
            </h3>
          </div>
          <div className="grow" />
          {isFinalisationPath && (
            <div className="flex items-center gap-3">
              <AutoSaveStatus onStatusClick={() => autoSaveModal.open()} />

              <Button
                disabled={!isStructureReadyToFinalise}
                onClick={async () => {
                  await handleFinalisation();
                  finalisationSuccessModal.open();
                }}
              >
                Finaliser la création
              </Button>
            </div>
          )}
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
                label: "Calendrier",
                section: "#calendrier",
                isDisplayed: true,
              },
              {
                label: "Type de places",
                section: "#places",
                isDisplayed: true,
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
                isDisplayed: true,
              },
              { label: "Activité", section: "#activite", isDisplayed: false },
              {
                label: "Actes administratifs",
                section: "#actes-administratifs",
                isDisplayed: true,
              },
              { label: "Notes", section: "#notes", isDisplayed: true },
            ]}
          />
        )}
        {isRootPath && !isStructureFinalisee && <FinalisationHeader />}
      </div>
      <autoSaveModal.Component
        title="Votre progression est enregistrée automatiquement"
        buttons={[
          {
            doClosesModal: true,
            children: "J’ai compris",
            type: "button",
          },
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
  ) : null;
};
