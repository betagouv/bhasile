import { v4 as uuidv4 } from "uuid";

import { StructureApiType } from "@/schemas/api/structure.schema";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "./structure.util";

export const getActesAdministratifsDefaultValues = (
  structure: StructureApiType
): ActeAdministratifFormValues[] => {
  const categoriesToDisplay = Object.keys(
    getActesAdministratifsCategoryToDisplay(structure)
  ) as ActeAdministratifCategory[number][];

  const missingCategories = categoriesToDisplay.filter(
    (category) =>
      !structure.actesAdministratifs?.some(
        (acteAdministratif) => acteAdministratif.category === category
      )
  );

  return [
    ...(structure.actesAdministratifs?.map((acteAdministratif) => ({
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

export const getActesAdministratifsCategoryToDisplay = (
  structure?: StructureApiType
): CategoryDisplayRulesType => ({
  ARRETE_AUTORISATION: {
    categoryShortName: "arrêté",
    title: "Arrêtés d'autorisation",
    canAddFile: true,
    canAddAvenant: true,
    isOptional: false,
    shouldShow: isStructureAutorisee(structure?.type),
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
    shouldShow: isStructureAutorisee(structure?.type),
    additionalFieldsType: AdditionalFieldsType.DATE_START_END,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter un arrêté de tarification",
  },
  CONVENTION: {
    categoryShortName: "convention",
    title: "Conventions",
    canAddFile: true,
    canAddAvenant: true,
    isOptional: !isStructureSubventionnee(structure?.type),
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

type CategoryDisplayRulesType = Record<
  ActeAdministratifCategory[number],
  {
    categoryShortName: string;
    title: string;
    canAddFile: boolean;
    canAddAvenant: boolean;
    isOptional: boolean;
    shouldShow: boolean;
    additionalFieldsType: AdditionalFieldsType;
    documentLabel: string;
    addFileButtonLabel: string;
    notice?: string | React.ReactElement;
  }
>;

export enum AdditionalFieldsType {
  DATE_START_END,
  NAME,
}
