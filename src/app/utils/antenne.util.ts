import { AntenneApiType } from "@/schemas/api/antenne.schema";
import { AntenneFormValues } from "@/schemas/forms/base/antenne.schema";

export const transformApiAntennesToFormAntennes = (
  antennes: AntenneApiType[]
): AntenneFormValues[] => {
  return antennes?.map((antenne) => ({
    ...antenne,
    name: antenne.name ?? "",
    adresseComplete: [antenne.adresse, antenne.codePostal, antenne.commune]
      .filter(Boolean)
      .join(" ")
      .trim(),
    adresse: antenne.adresse ?? "",
    codePostal: antenne.codePostal ?? "",
    commune: antenne.commune ?? "",
  }));
};
