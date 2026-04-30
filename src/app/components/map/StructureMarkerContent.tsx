"use client";

import Link from "next/link";

import { RepartitionBadge } from "@/app/(authenticated)/structures/(structure)/_components/RepartitionBadge";
import { useFetchStructure } from "@/app/hooks/useFetchStructure";
import { formatDate } from "@/app/utils/date.util";
import { getFinalisationFormStatus } from "@/app/utils/finalisationForm.util";
import { getCommunesGroupedByDepartement } from "@/app/utils/structure.util";
import { DEPARTEMENTS } from "@/constants";

export const StructureMarkerContent = ({ id }: { id: number }) => {
  const { structure } = useFetchStructure(id);
  if (!structure) {
    return null;
  }
  const { codeBhasile, type, operateurLabel, nom, finConvention } = structure;

  const isStructureFinalisee = getFinalisationFormStatus(structure);

  return (
    <div>
      <div className="text-xs font-bold text-title-blue-france">
        {codeBhasile}
      </div>
      <div className="text-xl text-title-blue-france m-0 flex gap-x-4 flex-wrap">
        <strong className="">
          {type}, {operateurLabel}
        </strong>
      </div>
      <div className="text-sm mb-1 text-title-blue-france">
        <span>
          {getCommunesGroupedByDepartement(structure).map(
            ({ departement, communes }) => (
              <span key={departement} className="block">
                {communes.join(", ")} –{" "}
                {DEPARTEMENTS.find((d) => d.numero === departement)?.name ??
                  departement}
              </span>
            )
          )}
        </span>
      </div>
      <div className="text-sm mb-1">
        <strong>Places autorisées : </strong>
        <span>{structure.currentPlaces.placesAutorisees}</span>
      </div>
      {finConvention && (
        <div className="text-sm mb-2">
          <strong>Fin convention : </strong>
          <span>{formatDate(finConvention)}</span>
        </div>
      )}
      <div className="text-sm mb-2">
        <RepartitionBadge
          repartition={structure.repartition}
          className="m-0!"
        />
      </div>
      <div className="flex justify-end">
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
