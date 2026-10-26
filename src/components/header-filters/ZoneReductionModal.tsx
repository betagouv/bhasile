"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { useIsModalOpen } from "@codegouvfr/react-dsfr/Modal/useIsModalOpen";
import { prDsfrLoaded } from "@codegouvfr/react-dsfr/start";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { useSearchParams } from "next/navigation";
import { ReactElement, useEffect } from "react";

import { parseCommaList } from "@/app/utils/string.util";
import { buildZoneSummary } from "@/app/utils/zone.util";
import { INITIAL_ZONE_PARAM } from "@/constants";

const modal = createModal({
  id: "zone-reduction-modal",
  isOpenedByDefault: false,
});

export const ZoneReductionModal = (): ReactElement => {
  const searchParams = useSearchParams();
  const initialZone = searchParams.get(INITIAL_ZONE_PARAM);

  useEffect(() => {
    if (initialZone) {
      prDsfrLoaded.then(() => modal.open());
    }
  }, [initialZone]);

  useIsModalOpen(modal, {
    onConceal: () => {
      const params = new URLSearchParams(window.location.search);
      params.delete(INITIAL_ZONE_PARAM);
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
  });

  return (
    <modal.Component
      title="Attention, le filtre Zone a été modifié."
      buttons={[{ doClosesModal: true, children: "J’ai compris" }]}
      className="[&_h1]:text-left! [&_p]:text-left!"
    >
      {initialZone && (
        <div className="flex items-center justify-center gap-2 my-4">
          <Tag small>{buildZoneSummary(parseCommaList(initialZone)) ?? ""}</Tag>
          <span className="fr-icon-arrow-right-line fr-icon--sm" />
          <Tag small>
            {buildZoneSummary(
              parseCommaList(searchParams.get("departements"))
            ) ?? ""}
          </Tag>
        </div>
      )}
      <p>
        Sur la vue cartographie, un seul filtre de zone peut être sélectionné.
        Nous en avons conservé un seul parmi votre sélection, veillez à ce que
        ce dernier soit adapté à votre recherche.
      </p>
    </modal.Component>
  );
};
