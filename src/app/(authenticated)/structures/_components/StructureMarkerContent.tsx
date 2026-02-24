import Link from "next/link";
import { ReactElement } from "react";

import { useFetchStructure } from "@/app/hooks/useFetchStructure";
import { formatDate } from "@/app/utils/date.util";
import { getFinalisationFormStatus } from "@/app/utils/finalisationForm.util";
import {
  getCurrentPlacesAutorisees,
  getOperateurLabel,
  getPlacesByCommunes,
  getRepartition,
} from "@/app/utils/structure.util";
import { DEPARTEMENTS } from "@/constants";

import { RepartitionBadge } from "./RepartitionBadge";

export const StructureMarkerContent = ({ id }: { id: number }) => {
  const { structure } = useFetchStructure(id);
  if (!structure) {
    return null;
  }
  const {
    dnaCode,
    type,
    filiale,
    operateur,
    nom,
    communeAdministrative,
    departementAdministratif,
    codePostalAdministratif,
    finConvention,
    adresses,
  } = structure;

  const placesAutorisees = getCurrentPlacesAutorisees(structure);
  const repartition = getRepartition(structure);
  const departementLabel = DEPARTEMENTS.find(
    (departement) => departement.numero === departementAdministratif
  )?.name;
  const isStructureFinalisee = getFinalisationFormStatus(structure);

  const getCommunesLabel = (): ReactElement => {
    const placesByCommunes = getPlacesByCommunes(adresses);
    return (
      <>
        {Object.entries(placesByCommunes).map(
          (placeByCommune, index, communes) => (
            <span key={placeByCommune[0]}>
              {placeByCommune[0]}{" "}
              <span className="italic">({placeByCommune[1]} places)</span>
              {index < communes.length - 1 ? ", " : ""}
            </span>
          )
        )}
      </>
    );
  };

  return (
    <div>
      <div className="text-xl text-title-blue-france m-0 flex gap-x-4 flex-wrap">
        <strong className="">
          {type}, {getOperateurLabel(filiale, operateur?.name)}
        </strong>
        <span>{placesAutorisees}&nbsp;places</span>
      </div>
      <div className="text-base text-title-blue-france">
        {communeAdministrative}, {departementLabel} (
        {codePostalAdministratif.substring(0, 2)})
      </div>
      {finConvention && (
        <div className="text-sm mt-1 mb-0">
          <strong>Fin convention : </strong>
          <span>{formatDate(finConvention)}</span>
        </div>
      )}
      <div className="text-sm mt-1 mb-0">
        <strong>Code DNA</strong> {dnaCode}
      </div>
      <div className="text-sm mt-1 mb-0">
        <span className="pr-1">
          <RepartitionBadge repartition={repartition} className="mb-0!" />
        </span>
        <span>{getCommunesLabel()}</span>
      </div>
      <div className="flex justify-end mt-2">
        <Link
          className={`fr-btn fr-btn--tertiary-no-outline ${isStructureFinalisee ? "fr-icon-arrow-right-line" : "fr-icon-edit-line"} `}
          title={`Détails de ${nom}`}
          href={
            isStructureFinalisee
              ? `structures/${id}`
              : `structures/${id}/finalisation/01-identification`
          }
        >
          Détails de {nom}
        </Link>
      </div>
    </div>
  );
};
