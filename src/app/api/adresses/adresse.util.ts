import { Adresse, AdresseTypologie } from "@/generated/prisma/client";
import { AdresseApiType } from "@/schemas/api/adresse.schema";

import { StructureDbDetails } from "../structures/structure.db.type";

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

export const handleAdresses = (
  dnaCode: string,
  adresses: AdresseApiType[]
): AdresseInput[] => {
  return adresses.map(
    (adresse) =>
      ({
        adresse: adresse.adresse,
        codePostal: adresse.codePostal,
        commune: adresse.commune,
        repartition: adresse.repartition,
        structureDnaCode: dnaCode,
        adresseTypologies: adresse.adresseTypologies,
      }) as unknown as AdresseInput
  );
};

export const getAdressesApiRead = (
  adresses?: StructureDbDetails["adresses"]
) =>
  adresses?.map((adresse) => ({
    id: adresse.id,
    adresse: adresse.adresse ?? "",
    codePostal: adresse.codePostal ?? "",
    commune: adresse.commune ?? "",
    repartition: adresse.repartition ?? undefined,
    adresseTypologies: adresse.adresseTypologies,
    adresseComplete: [adresse.adresse, adresse.codePostal, adresse.commune]
      .filter(Boolean)
      .join(" ")
      .trim(),
  }));

export type AdresseWithTypologies = Adresse & {
  adresseTypologies: AdresseTypologie[];
};

export type AdresseInput = Omit<AdresseWithTypologies, "id"> & {
  createdAt?: Date;
  updatedAt?: Date;
};
