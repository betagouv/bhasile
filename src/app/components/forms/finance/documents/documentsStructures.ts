import { isDocumentCoveredByCpom } from "@/app/utils/document-financier.util";
import { DOCUMENTS_FINANCIERS_OPEN_YEAR } from "@/constants";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { DocumentFinancierCategory } from "@/types/document-financier.type";

export const structureAutoriseesDocuments: StructureDocument[] = [
  {
    label: "Budget prévisionnel demandé",
    subLabel: "par l'opérateur",
    value: "BUDGET_PREVISIONNEL_DEMANDE",
    yearOffset: 0,
    required: true,
  },
  {
    label: "Rapport budgétaire",
    subLabel: "si séparé du budget prévisionnel demandé",
    value: "RAPPORT_BUDGETAIRE",
    yearOffset: 0,
    required: false,
  },
  {
    label: "Budget prévisionnel retenu (ou exécutoire)",
    subLabel: "par l'autorité de tarification",
    value: "BUDGET_PREVISIONNEL_RETENU",
    yearOffset: 0,
    required: true,
  },
  {
    label: "Budget rectificatif",
    subLabel: "intervenu en cours d'année",
    value: "BUDGET_RECTIFICATIF",
    yearOffset: 1,
    required: false,
  },
  {
    label: "Compte administratif soumis",
    subLabel: "par l'opérateur",
    value: "COMPTE_ADMINISTRATIF_SOUMIS",
    yearOffset: 1,
    required: true,
  },
  {
    label: "Rapport d'activité",
    subLabel: "qui accompagne le compte administratif soumis",
    value: "RAPPORT_ACTIVITE",
    yearOffset: 1,
    required: true,
  },
  {
    label: "Compte administratif retenu",
    subLabel: "par l'autorité de tarification",
    value: "COMPTE_ADMINISTRATIF_RETENU",
    yearOffset: 2,
    required: true,
  },
  {
    label: "Autre document",
    value: "AUTRE_FINANCIER",
    yearOffset: 0,
    required: false,
  },
];
export const structureSubventionneesDocuments: StructureDocument[] = [
  {
    label: "Demande de subvention",
    value: "DEMANDE_SUBVENTION",
    yearOffset: 2,
    required: true,
  },
  {
    label: "Compte-rendu financier",
    value: "COMPTE_RENDU_FINANCIER",
    yearOffset: 2,
    required: true,
  },
  {
    label: "Rapport d'activité de l'opérateur",
    value: "RAPPORT_ACTIVITE_OPERATEUR",
    yearOffset: 2,
    required: true,
  },
  {
    label: "Autre document",
    value: "AUTRE_FINANCIER",
    yearOffset: 0,
    required: false,
  },
];

export const isDocumentStillRequired = (
  document: StructureDocument,
  year: number,
  coveredDocumentsFinanciers: DocumentFinancierApiType[] = []
): boolean =>
  document.required &&
  year <= DOCUMENTS_FINANCIERS_OPEN_YEAR - document.yearOffset &&
  !isDocumentCoveredByCpom(coveredDocumentsFinanciers, document.value, year);

export type StructureDocument = {
  label: string;
  subLabel?: string;
  value: DocumentFinancierCategory;
  yearOffset: number;
  required: boolean;
};
