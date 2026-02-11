import Image from "next/image";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { formatDate } from "@/app/utils/date.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ActiviteHistorique } from "./ActiviteHistorique";
import { ActiviteMotifsIndisponibilite } from "./ActiviteMotifsIndisponibilite";
import { ActivitePlaces } from "./ActivitePlaces";

export const ActiviteBlock = (): ReactElement => {
  const { structure } = useStructureContext();
  const { activites } = structure;

  return (
    <Block title="Activité" iconClass="fr-icon-team-line">
      <div className="flex pb-12">
        <span className="text-title-blue-france">
          Données mensuelles mises à jour le {formatDate(activites?.[0]?.date)}
        </span>
        <div style={{ position: "relative", width: 40 }}>
          <Image
            src="/ofii.webp"
            alt="Logo de l'OFII"
            fill
            sizes="(min-width: 40px)"
            loading="lazy"
          />
        </div>
      </div>
      <div className="pb-6">
        <ActivitePlaces />
      </div>
      <div className="pb-12">
        <ActiviteMotifsIndisponibilite />
      </div>
      <ActiviteHistorique />
      <div className="italic pt-6">
        La méthode de calcul ayant changé au 01/01/2025, l’outil donne accès aux
        données seulement à partir de cette date.
      </div>
    </Block>
  );
};
