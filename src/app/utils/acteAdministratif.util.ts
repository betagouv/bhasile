import type { ReactElement } from "react";
import { v4 as uuidv4 } from "uuid";

import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export const getActesAdministratifsDefaultValues = (
  actesAdministratifs: ActeAdministratifFormValues[] | undefined,
  categoryRules: CategoryDisplayRules
): ActeAdministratifFormValues[] => {
  const categoriesToDisplay = (
    Object.entries(categoryRules) as [
      ActeAdministratifCategory,
      CategoryDisplayRule,
    ][]
  )
    .filter(([, rules]) => rules.shouldShow)
    .map(([category]) => category);

  const missingCategories = categoriesToDisplay.filter(
    (category) =>
      !actesAdministratifs?.some(
        (acteAdministratif) => acteAdministratif.category === category
      )
  );

  return [
    ...(actesAdministratifs?.map((acteAdministratif) => ({
      id: acteAdministratif.id ?? undefined,
      category: acteAdministratif.category,
      date: acteAdministratif.date || undefined,
      startDate: acteAdministratif.startDate || "",
      endDate: acteAdministratif.endDate || "",
      name: acteAdministratif.name,
      parentId: acteAdministratif.parentId || undefined,
      fileUploads: acteAdministratif.fileUploads || undefined,
    })) || []),
    ...missingCategories.map((category) => ({
      uuid: uuidv4(),
      category,
    })),
  ];
};

export const getStructureActesAdministratifsCategoryToDisplay = (
  structure?: StructureApiRead
): CategoryDisplayRules => ({
  ARRETE_AUTORISATION: {
    categoryShortName: "arrêté",
    title: "Arrêtés d'autorisation",
    canAddFile: true,
    canAddAvenant: true,
    isOptional: false,
    shouldShow: structure?.isAutorisee ?? false,
    additionalFieldsType: AdditionalFieldsType.DATE_START_END,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter un arrêté d'autorisation",
  },
  ARRETE_TARIFICATION: {
    categoryShortName: "arrêté",
    title: "Arrêtés de tarification",
    canAddFile: true,
    canAddAvenant: true,
    isOptional: false,
    shouldShow: structure?.isAutorisee ?? false,
    additionalFieldsType: AdditionalFieldsType.DATE_START_END,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter un arrêté de tarification",
  },
  CONVENTION: {
    categoryShortName: "convention",
    title: "Conventions",
    canAddFile: true,
    canAddAvenant: true,
    isOptional: !(structure?.isSubventionnee ?? false),
    shouldShow: true,
    additionalFieldsType: AdditionalFieldsType.DATE_START_END,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter une convention",
  },
  AUTRE: {
    categoryShortName: "autre",
    title: "Autres documents",
    canAddFile: true,
    canAddAvenant: false,
    isOptional: true,
    shouldShow: true,
    additionalFieldsType: AdditionalFieldsType.NAME,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter un document",
    notice: `Dans cette catégorie, vous avez la possibilité d’importer d’autres
        documents utiles à l’analyse de la structure (ex:
        Plans Pluriannuels d’Investissements)`,
  },
});

export const getOperateurActesAdministratifsCategoryToDisplay =
  (): CategoryDisplayRules => ({
    RAPPORT_ACTIVITE_OPERATEUR: {
      categoryShortName: "convention",
      title: "Rapport d'activité",
      canAddFile: true,
      canAddAvenant: false,
      isOptional: true,
      shouldShow: true,
      additionalFieldsType: AdditionalFieldsType.DATE_START_END,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un rapport",
    },
    FRAIS_DE_SIEGE: {
      categoryShortName: "arrêté",
      title: "Frais de siège",
      canAddFile: true,
      canAddAvenant: false,
      isOptional: true,
      shouldShow: true,
      additionalFieldsType: AdditionalFieldsType.DATE_START_END,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter des frais de siège",
    },
    STATUTS: {
      categoryShortName: "du document",
      title: "Statuts",
      canAddFile: true,
      canAddAvenant: false,
      isOptional: true,
      shouldShow: true,
      additionalFieldsType: AdditionalFieldsType.DATE,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter des statut",
    },
    AUTRE: {
      categoryShortName: "autre",
      title: "Autres documents",
      canAddFile: true,
      canAddAvenant: false,
      isOptional: true,
      shouldShow: true,
      additionalFieldsType: AdditionalFieldsType.NAME,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un document",
    },
  });

export const getOperateurActesAdministratifsDefaultValues = (
  operateur?: OperateurApiRead
): ActeAdministratifFormValues[] =>
  getActesAdministratifsDefaultValues(
    operateur?.actesAdministratifs,
    getOperateurActesAdministratifsCategoryToDisplay()
  );

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
};

export type CategoryDisplayRules = Partial<
  Record<ActeAdministratifCategory, CategoryDisplayRule>
>;

export enum AdditionalFieldsType {
  DATE_START_END,
  DATE,
  NAME,
}
