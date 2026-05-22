import { StructureDbDetails } from "../structures/structure.db.type";

export const getAntennesApiRead = (
  antennes?: StructureDbDetails["antennes"]
) =>
  antennes?.map((antenne) => ({
    ...antenne,
    name: antenne.name ?? "",
    adresse: antenne.adresse ?? "",
    codePostal: antenne.codePostal ?? "",
    commune: antenne.commune ?? "",
    adresseComplete: [antenne.adresse, antenne.codePostal, antenne.commune]
      .filter(Boolean)
      .join(" ")
      .trim(),
  }));
