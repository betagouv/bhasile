export const ActeAdministratifCategory = [
  "ARRETE_AUTORISATION",
  "ARRETE_FUSION",
  "ARRETE_EXTENSION",
  "ARRETE_CONTRACTION",
  "CONVENTION",
  "CONVENTION_CPOM",
  "ARRETE_TARIFICATION",
  "RAPPORT_ACTIVITE_OPERATEUR",
  "FRAIS_DE_SIEGE",
  "STATUTS",
  "AUTRE",
  "CPOM",
] as const;

export type ActeAdministratifCategory =
  (typeof ActeAdministratifCategory)[number];

export type StructureParentActe = {
  id: number;
  category: ActeAdministratifCategory | null;
  startDate: string | null;
  endDate: string | null;
  children: { endDate: string | null }[];
};
