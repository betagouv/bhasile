import { CURRENT_OPEN_YEAR, CURRENT_YEAR } from "@/constants";
import {
  DocumentFinancierCategory,
  DocumentFinancierGranularity,
} from "@/types/document-financier.type";

const baseYearIndex = CURRENT_YEAR - CURRENT_OPEN_YEAR;

export const structureAutoriseesDocuments: StructureDocument[] = [
  {
    label: "Budget prévisionnel demandé",
    subLabel: "par l'opérateur",
    value: "BUDGET_PREVISIONNEL_DEMANDE",
    yearIndex: baseYearIndex,
    required: true,
  },
  {
    label: "Rapport budgétaire",
    subLabel: "si séparé du budget prévisionnel demandé",
    value: "RAPPORT_BUDGETAIRE",
    yearIndex: baseYearIndex,
    required: false,
  },
  {
    label: "Budget prévisionnel retenu (ou exécutoire)",
    subLabel: "par l'autorité de tarification",
    value: "BUDGET_PREVISIONNEL_RETENU",
    yearIndex: baseYearIndex,
    required: true,
  },
  {
    label: "Budget rectificatif",
    subLabel: "intervenu en cours d'année",
    value: "BUDGET_RECTIFICATIF",
    yearIndex: baseYearIndex + 1,
    required: false,
  },
  {
    label: "Compte administratif soumis",
    subLabel: "par l'opérateur",
    value: "COMPTE_ADMINISTRATIF_SOUMIS",
    yearIndex: baseYearIndex + 1,
    required: true,
  },
  {
    label: "Rapport d'activité",
    subLabel: "qui accompagne le compte administratif soumis",
    value: "RAPPORT_ACTIVITE",
    yearIndex: baseYearIndex + 1,
    required: true,
  },
  {
    label: "Compte administratif retenu",
    subLabel: "par l'autorité de tarification",
    value: "COMPTE_ADMINISTRATIF_RETENU",
    yearIndex: baseYearIndex + 2,
    required: true,
  },
  {
    label: "Autre document",
    value: "AUTRE_FINANCIER",
    yearIndex: baseYearIndex,
    required: false,
  },
];
export const structureSubventionneesDocuments: StructureDocument[] = [
  {
    label: "Demande de subvention",
    value: "DEMANDE_SUBVENTION",
    yearIndex: baseYearIndex + 2,
    required: true,
  },
  {
    label: "Compte-rendu financier",
    value: "COMPTE_RENDU_FINANCIER",
    yearIndex: baseYearIndex + 2,
    required: true,
  },
  {
    label: "Rapport d'activité de l'opérateur",
    value: "RAPPORT_ACTIVITE_OPERATEUR",
    yearIndex: baseYearIndex + 2,
    required: true,
  },
  {
    label: "Autre document",
    value: "AUTRE_FINANCIER",
    yearIndex: baseYearIndex,
    required: false,
  },
];

export const granularities: DocumentGranularity[] = [
  {
    label: "Structure",
    value: "STRUCTURE",
  },
  {
    label: "CPOM",
    value: "CPOM",
  },
  {
    label: "Structure et CPOM",
    value: "STRUCTURE_ET_CPOM",
  },
];

export type StructureDocument = {
  label: string;
  subLabel?: string;
  value: DocumentFinancierCategory;
  yearIndex: number;
  required: boolean;
};

type DocumentGranularity = {
  label: string;
  value: DocumentFinancierGranularity[number];
};
