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
