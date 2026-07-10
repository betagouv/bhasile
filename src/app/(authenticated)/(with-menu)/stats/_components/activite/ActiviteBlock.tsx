import Image from "next/image";

import { formatDate } from "@/app/utils/date.util";

import { ActiviteHistoriqueTable } from "../../../structures/[id]/_components/_activite/ActiviteHistoriqueTable";
import { ActiviteMotifsIndisponibilite } from "../../../structures/[id]/_components/_activite/ActiviteMotifsIndisponibilite";
import { ActivitePlaces } from "../../../structures/[id]/_components/_activite/ActivitePlaces";
import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";
import { ActiviteStatsChart } from "./ActiviteStatsChart";

export const ActiviteBlock = () => {
  const { statistiques } = useStatistiquesContext();

  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className="text-title-blue-france mr-3 fr-icon-team-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">Activité</h3>
        </div>
        <div className="flex items-center text-right">
          <span className="text-title-blue-france text-xs ">
            Données mensuelles de l’OFII
            <span className="italic block">
              mises à jour le{" "}
              {formatDate(statistiques.activite.byMonth[0].date)}
            </span>
          </span>
          <div className="relative h-[38] w-[68]">
            <Image
              src="/ofii.webp"
              alt="Logo de l'OFII"
              fill
              sizes="(min-width: 91px)"
              loading="lazy"
            />
          </div>
        </div>
      </div>
      <h4 className="text-lg text-title-blue-france" id="indisponibilite-title">
        Indisponibilité
      </h4>
      <div className="flex pt-10 pb-16">
        <ActivitePlaces
          placesAutorisees={statistiques.activite.summary.placesEnregistreesDna}
          placesIndisponibles={
            statistiques.activite.summary.placesIndisponibles
          }
        />
        <div className="pl-20 w-100">
          <ActiviteMotifsIndisponibilite
            desinsectisation={
              statistiques.activite.summary.motifsIndisponibilite
                .desinsectisation
            }
            remiseEnEtat={
              statistiques.activite.summary.motifsIndisponibilite.remiseEnEtat
            }
            sousOccupation={
              statistiques.activite.summary.motifsIndisponibilite.sousOccupation
            }
            travaux={
              statistiques.activite.summary.motifsIndisponibilite.travaux
            }
          />
        </div>
      </div>
      <h4 className="text-lg text-title-blue-france" id="indisponibilite-title">
        Indisponibilité et présence indue
      </h4>
      <div className="pb-16">
        <ActiviteStatsChart />
      </div>
      <h4 className="text-lg text-title-blue-france" id="indisponibilite-title">
        Tableau de données
      </h4>
      <ActiviteHistoriqueTable activites={statistiques.activite.byMonth} />
    </div>
  );
};
