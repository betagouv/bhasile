import { StructureDbDetails } from "../structures/structure.db.type";

export const getAntennesApiRead = (
  antennes?: StructureDbDetails["antennes"]
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
