import type { ReactElement } from "react";

import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export enum AdditionalFieldsType {
  DATE_START_END,
  DATE,
  NAME,
}

export type ResolvedAvenantParent = {
  id: number;
  startYear: number;
  endYear: number;
};

export type AvenantAlternative = {
  parentCategory: ActeAdministratifCategory;
  avenantLabel: string;
  resolvedParent?: ResolvedAvenantParent;
};

export type CategoryDisplayRule = {
  categoryShortName: string;
  title: string;
  canAddFile: boolean;
  canAddAvenant: boolean;
  isOptional: boolean;
  shouldShow: boolean;
  additionalFieldsType: AdditionalFieldsType;
  documentLabel: string;
  addFileButtonLabel: string;
  notice?: string | ReactElement;
  alternativeCategories?: ActeAdministratifCategory[];
  avenantAlternative?: AvenantAlternative;
};

export type CategoryDisplayRules = Partial<
  Record<ActeAdministratifCategory, CategoryDisplayRule>
>;

export const ACTE_ADMINISTRATIF_CATEGORY_LABELS: Record<
  ActeAdministratifCategory,
  string
> = {
  ARRETE_AUTORISATION: "Arrêtés d'autorisation",
  ARRETE_TARIFICATION: "Arrêtés de tarification",
  ARRETE_EXTENSION: "Arrêtés d'extension",
  ARRETE_CONTRACTION: "Arrêtés de contraction",
  ARRETE_FUSION: "Arrêtés de fusion",
  CONVENTION: "Conventions",
  CONVENTION_CPOM: "Conventions CPOM",
  STATUTS: "Statuts",
  FRAIS_DE_SIEGE: "Frais de siège",
  RAPPORT_ACTIVITE_OPERATEUR: "Rapport d'activité",
  CPOM: "CPOM",
  AUTRE: "Autres documents",
};
