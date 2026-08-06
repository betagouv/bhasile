import { StructureVersionDbDetails } from "../structure-versions/structure-version.db.type";

export const getAntennesApiRead = (
  antennes?: StructureVersionDbDetails["antennes"]
) =>
  antennes?.map((antenne) => ({
    id: antenne.id,
    name: antenne.name ?? "",
    adresse: antenne.adresse ?? "",
    codePostal: antenne.codePostal ?? "",
    commune: antenne.commune ?? "",
    departement: antenne.departement ?? undefined,
    adresseComplete: [antenne.adresse, antenne.codePostal, antenne.commune]
      .filter(Boolean)
      .join(" ")
      .trim(),
  }));
