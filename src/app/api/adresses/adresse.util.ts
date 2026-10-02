import type { AdresseLocalisation } from "@/types/adresse.type";

import { StructureVersionDbDetails } from "../structure-versions/structure-version.db.type";

export const buildAdresseAdministrativeComplete = (parts: {
  adresseAdministrative?: string | null;
  codePostalAdministratif?: string | null;
  communeAdministrative?: string | null;
  departementAdministratif?: string | null;
}): string =>
  [
    parts.adresseAdministrative,
    parts.codePostalAdministratif,
    parts.communeAdministrative,
    parts.departementAdministratif,
  ]
    .filter(Boolean)
    .join(" ");

export const getAdressesApiRead = (
  adresses?: StructureVersionDbDetails["adresses"]
) =>
  adresses?.map((adresse) => ({
    id: adresse.id,
    adresse: adresse.adresse ?? "",
    codePostal: adresse.codePostal ?? "",
    commune: adresse.commune ?? "",
    repartition: adresse.repartition ?? undefined,
    placesAutorisees: adresse.placesAutorisees ?? undefined,
    isQpv: adresse.isQpv,
    isLogementSocial: adresse.isLogementSocial,
    adresseComplete: [adresse.adresse, adresse.codePostal, adresse.commune]
      .filter(Boolean)
      .join(" ")
      .trim(),
  }));

export type NormalizedLocalisation = { codePostal: string; commune: string };

// Excel supprime le zéro initial des codes postaux des départements 01 à 09 et les imports
// peuvent les formater avec une espace (« 75 011 »).
export const normalizeLocalisation = ({
  codePostal,
  commune,
}: AdresseLocalisation): NormalizedLocalisation | null => {
  const trimmedCommune = commune?.trim();
  const compactCodePostal = codePostal?.replace(/\s/g, "") ?? "";
  const paddedCodePostal = /^\d{4}$/.test(compactCodePostal)
    ? `0${compactCodePostal}`
    : compactCodePostal;

  if (!trimmedCommune || !/^\d{5}$/.test(paddedCodePostal)) {
    return null;
  }

  return { codePostal: paddedCodePostal, commune: trimmedCommune };
};

export const buildCommuneKey = ({
  codePostal,
  commune,
}: NormalizedLocalisation): string => `${codePostal}|${commune.toLowerCase()}`;
