"use client";

import Notice from "@codegouvfr/react-dsfr/Notice";
import { ReactElement, useState } from "react";

import { Badge } from "@/app/components/common/Badge";
import { formatCityName } from "@/app/utils/adresse.util";
import { getRepartition } from "@/app/utils/structure.util";
import { Repartition } from "@/types/adresse.type";

import { useStructureContext } from "../../_context/StructureClientContext";

export const AdressesViewer = (): ReactElement => {
  const [showAdresses, setShowAdresses] = useState(false);

  const { structure } = useStructureContext();
  const repartition = getRepartition(structure);
  const { adresses } = structure || {};

  return (
    <>
      <strong className="pr-3">Type de bâti</strong>
      <span className="pr-2">{repartition}</span>
      {adresses?.some(
        ({ adresseTypologies }) => adresseTypologies?.[0]?.qpv
      ) && (
        <span className="pr-2">
          <Badge type="purple">QPV</Badge>
        </span>
      )}
      {adresses?.some(
        ({ adresseTypologies }) => adresseTypologies?.[0]?.logementSocial
      ) && <Badge type="purple">Logement social</Badge>}
      <button
        className={`fr-btn fr-btn--sm fr-btn--icon-left fr-btn--tertiary-no-outline py-0 ${
          showAdresses ? "fr-icon-eye-off-line" : "fr-icon-eye-line"
        }`}
        onClick={() => setShowAdresses(!showAdresses)}
      >
        {showAdresses
          ? "Masquer la liste des hébergements"
          : "Voir la liste des hébergements"}
      </button>
      {showAdresses && (
        <div className="text-mention-grey">
          {adresses?.length === 0 && (
            <Notice
              severity="alert"
              title=""
              className="rounded [&_p]:flex  [&_p]:items-center"
              description="Un problème technique a empêché l’enregistrement des hébergements liés à cette structure. La situation est en cours de correction, merci pour votre compréhension."
            />
          )}
          {adresses?.map((adresse) => (
            <div key={adresse.id} className="pb-1">
              <span className="pr-2">
                {adresse.adresse}, {adresse.codePostal}{" "}
                {formatCityName(adresse.commune ?? "")}{" "}
                <span className="italic">
                  ({adresse.adresseTypologies?.[0]?.placesAutorisees} places)
                </span>
                {" - "}
                {
                  Repartition[
                    adresse.repartition as unknown as keyof typeof Repartition
                  ]
                }
              </span>
              {adresse.adresseTypologies?.[0]?.qpv !== 0 && (
                <span className="pr-1">
                  <Badge type="purple">QPV</Badge>
                </span>
              )}
              {adresse.adresseTypologies?.[0]?.logementSocial !== 0 && (
                <Badge type="purple">Logement social</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};
