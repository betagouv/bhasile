import { v4 as uuidv4 } from "uuid";

import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { DocumentOperateurFormValues } from "@/schemas/forms/base/documentOperateur.schema";
import { DocumentOperateurCategory } from "@/types/document-operateur.type";

export const getDocumentsOperateurDefaultValues = (
  operateur: OperateurApiRead
): DocumentOperateurFormValues[] => {
  const categoryDisplayRules = getDocumentsOperateurCategories();
  const categoriesToDisplay = (
    Object.entries(categoryDisplayRules) as [
      Exclude<DocumentOperateurCategory, "CPOM">,
      (typeof categoryDisplayRules)[DocumentOperateurCategory],
    ][]
  ).map(([category]) => category);

  const missingCategories = categoriesToDisplay.filter(
    (category) =>
      !operateur.documents?.some((documents) => documents.category === category)
  );

  return [
    ...(operateur.documents?.map((document) => ({
      id: document.id ?? undefined,
      category: document.category,
      date: document.date || undefined,
      name: document.name,
      fileUploads: document.fileUploads || undefined,
    })) || []),
    ...missingCategories.map((category) => ({
      uuid: uuidv4(),
      category,
    })),
  ];
};

export const getDocumentsOperateurCategories =
  (): CategoryDisplayRulesType => ({
    RAPPORT_ACTIVITE: {
      categoryShortName: "rapport",
      title: "Rapport d'activité",
      canAddFile: true,
      isOptional: true,
      additionalFieldsType: AdditionalFieldsType.DATE,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un rapport d'activité",
    },
    FRAIS_DE_SIEGE: {
      categoryShortName: "frais de siège",
      title: "Frais de siège",
      canAddFile: true,
      isOptional: true,
      additionalFieldsType: AdditionalFieldsType.DATE,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un frais de siège",
    },
    STATUTS: {
      categoryShortName: "statut",
      title: "Statuts",
      canAddFile: true,
      isOptional: true,
      additionalFieldsType: AdditionalFieldsType.DATE,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un statut",
    },
    AUTRE: {
      categoryShortName: "autre",
      title: "Autres documents",
      canAddFile: true,
      isOptional: true,
      additionalFieldsType: AdditionalFieldsType.NAME,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un document",
    },
  });

type CategoryDisplayRulesType = Record<
  DocumentOperateurCategory,
  {
    categoryShortName: string;
    title: string;
    canAddFile: boolean;
    isOptional: boolean;
    additionalFieldsType: AdditionalFieldsType;
    documentLabel: string;
    addFileButtonLabel: string;
  }
>;

export enum AdditionalFieldsType {
  DATE,
  NAME,
}
