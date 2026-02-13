import Image from "next/image";
import { ReactElement } from "react";

import { formatDate } from "@/app/utils/date.util";
import { StructureType } from "@/types/structure.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ActiviteHistorique } from "./ActiviteHistorique";
import { ActiviteMotifsIndisponibilite } from "./ActiviteMotifsIndisponibilite";
import { ActivitePlaces } from "./ActivitePlaces";

export const ActiviteBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  return (
    <div className="bg-white p-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span
            className={`text-title-blue-france fr-mr-1w fr-icon-team-line`}
          />
          <h3 className="text-title-blue-france fr-h5">Activité</h3>
        </div>
        <div className="flex items-center">
          {structure.type === StructureType.CAES ? (
            <span className="text-title-blue-france">
              Pas de données OFII disponibles
            </span>
          ) : (
            <span className="text-title-blue-france">
              Données mensuelles de l’OFII
              <span className="italic block">
                mises à jour le{" "}
                {formatDate(structure?.activites?.[0]?.date ?? "N/A")}
              </span>
            </span>
          )}

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
      {structure.type !== StructureType.CAES && (
        <>
          <div className="pt-10 pb-6">
            <ActivitePlaces />
          </div>
          <div className="pb-12">
            <ActiviteMotifsIndisponibilite />
          </div>
          <ActiviteHistorique />
          <div className="italic pt-6">
            La méthode de calcul ayant changé au 01/01/2025, l’outil donne accès
            aux données seulement à partir de cette date.
          </div>
        </>
      )}
    </div>
  );
};
