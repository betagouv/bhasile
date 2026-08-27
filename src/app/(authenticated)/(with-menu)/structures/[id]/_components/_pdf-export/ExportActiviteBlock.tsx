"use client";

import { ReactElement, useMemo } from "react";

import { ActiviteHistoriqueTable } from "@/app/components/activites/ActiviteHistoriqueTable";
import { ActiviteMotifsIndisponibilite } from "@/app/components/activites/ActiviteMotifsIndisponibilite";
import { ActivitePlaces } from "@/app/components/activites/ActivitePlaces";
import { Block } from "@/app/components/common/Block";
import { useStructureContext } from "@/contexts/StructureContext";
import { StructureType } from "@/types/structure.type";

import { OfiiDisclaimer } from "../_activite/OfiiDisclaimer";

export const ExportActiviteBlock = ({
  startDate,
  endDate,
}: Props): ReactElement => {
  const { structure } = useStructureContext();

  const filteredActivites = useMemo(() => {
    if (!structure.activites) {
      return [];
    }

    return structure.activites.filter((activite) => {
      if (!activite.date) {
        return false;
      }

      const month =
        typeof activite.date === "string"
          ? activite.date.slice(0, 7)
          : new Date(activite.date).toISOString().slice(0, 7);

      return month >= startDate && month <= endDate;
    });
  }, [structure.activites, startDate, endDate]);

  const hasActivites = filteredActivites.length > 0;
  const showOfiiData = structure.type !== StructureType.CAES && hasActivites;

  return (
    <Block
      title="Activité"
      iconClass="fr-icon-team-line"
      entity={structure}
      entityType="Structure"
      disclaimer={<OfiiDisclaimer showOfiiData={showOfiiData} />}
    >
      {showOfiiData && (
        <>
          <h4
            className="text-lg text-title-blue-france"
            id="indisponibilite-title"
          >
            Indisponibilités
          </h4>
          <div className="flex pt-10 pb-10">
            <ActivitePlaces
              placesAutorisees={filteredActivites[0]?.placesEnregistreesDna}
              placesIndisponibles={filteredActivites[0]?.placesIndisponibles}
            />
            <div className="pl-20 w-100">
              <ActiviteMotifsIndisponibilite
                desinsectisation={filteredActivites[0]?.desinsectisation}
                remiseEnEtat={filteredActivites[0]?.remiseEnEtat}
                sousOccupation={filteredActivites[0]?.sousOccupation}
                travaux={filteredActivites[0]?.travaux}
              />
            </div>
          </div>
          <hr className="pb-10!" />
          <ActiviteHistoriqueTable activites={filteredActivites} />
        </>
      )}
    </Block>
  );
};

type Props = {
  startDate: string;
  endDate: string;
};
