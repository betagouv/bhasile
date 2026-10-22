"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { ReactElement, useEffect } from "react";

import { GLOBAL_FILTER_LABELS } from "./globalFilterLabels";
import { FiltersConstraintNotice } from "./useFiltersConstraints";

const modal = createModal({
  id: "filters-constraint-modal",
  isOpenedByDefault: false,
});

export const FiltersConstraintModal = ({
  notice,
  pageTitle,
}: Props): ReactElement => {
  useEffect(() => {
    if (notice) {
      modal.open();
    }
  }, [notice]);

  return (
    <modal.Component
      title={notice ? getTitle(notice) : ""}
      buttons={[{ doClosesModal: true, children: "J’ai compris" }]}
      className="[&_h1]:text-left! [&_p]:text-left!"
    >
      {notice?.kind === "zone" && (
        <>
          <div className="flex items-center justify-center gap-2 my-4">
            <Tag small>{notice.before}</Tag>
            <span className="fr-icon-arrow-right-line fr-icon--sm" />
            <Tag small>{notice.after}</Tag>
          </div>
          <p>
            Sur la vue cartographie, un seul filtre de zone peut être
            sélectionné. Nous en avons conservé un seul parmi votre sélection,
            veillez à ce que ce dernier soit adapté à votre recherche.
          </p>
        </>
      )}
      {notice?.kind === "hidden" && (
        <p>
          Sur l’onglet {pageTitle}, {formatLabels(notice)} ne s’applique pas.
          Celui-ci a été réinitialisé sur les autres onglets, veillez à ce qu’il
          soit adapté à la suite de votre navigation.
        </p>
      )}
    </modal.Component>
  );
};

const formatLabels = (
  notice: Extract<FiltersConstraintNotice, { kind: "hidden" }>
): string =>
  `le filtre ${notice.resetKeys.map((key) => GLOBAL_FILTER_LABELS[key]).join(", ")}`;

const getTitle = (notice: FiltersConstraintNotice): string =>
  notice.kind === "zone"
    ? `Attention, le filtre ${GLOBAL_FILTER_LABELS.departements} a été modifié.`
    : `Attention, ${formatLabels(notice)} ne s’applique pas.`;

type Props = {
  notice: FiltersConstraintNotice | null;
  pageTitle: string;
};
