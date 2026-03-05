"use client";

import Notice from "@codegouvfr/react-dsfr/Notice";
import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { formatCityName } from "@/app/utils/adresse.util";
import { Repartition } from "@/types/adresse.type";

import { useStructureContext } from "../../_context/StructureClientContext";

export const Adresses = (): ReactElement => {
  const { structure } = useStructureContext();
  const { adresses } = structure;

  if (adresses?.length === 0) {
    return (
      <Notice
        severity="alert"
        title=""
        className="rounded [&_p]:flex  [&_p]:items-center"
        description="Un problème technique a empêché l’enregistrement des hébergements liés à cette structure. La situation est en cours de correction, merci pour votre compréhension."
      />
    );
  }

  return (
    <table className="whitespace-nowrap">
      <tbody>
        {adresses?.map((adresse) => (
          <tr
            key={adresse.id}
            className="border-b border-default-grey last:border-b-0"
          >
            <td className="py-3 pr-8">
              {adresse.adresse}, {adresse.codePostal}{" "}
              {formatCityName(adresse.commune ?? "")}
            </td>
            <td className="py-3 pr-8">
              {adresse.adresseTypologies?.[0]?.placesAutorisees} places
            </td>
            <td className="py-3 pr-8">
              {
                Repartition[
                  adresse.repartition as unknown as keyof typeof Repartition
                ]
              }
            </td>
            <td className="py-3 w-full">
              {adresse.adresseTypologies?.[0]?.qpv !== 0 && (
                <span className="pr-1">
                  <Badge type="purple">QPV</Badge>
                </span>
              )}
              {adresse.adresseTypologies?.[0]?.logementSocial !== 0 && (
                <Badge type="purple">Logement social</Badge>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
