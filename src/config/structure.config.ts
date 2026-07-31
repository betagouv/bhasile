import {
  AdditionalFieldsType,
  CategoryDisplayRules,
} from "@/config/acte-administratif.config";
import { StructureApiRead } from "@/schemas/api/structure.schema";

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
    notice: `Dans cette catégorie, vous avez la possibilité d'importer d'autres documents utiles à l'analyse de la structure (ex: Plans Pluriannuels d'Investissements)`,
  },
});

export const getActualisationActesAdministratifsCategoryToDisplay = (
  structure?: StructureApiRead
): CategoryDisplayRules => {
  if (structure?.isAutorisee) {
    return {
      ARRETE_TARIFICATION: {
        categoryShortName: "arrêté",
        title: "Arrêtés de tarification",
        canAddFile: true,
        canAddAvenant: false,
        isOptional: false,
        shouldShow: true,
        additionalFieldsType: AdditionalFieldsType.DATE_START_END,
        documentLabel: "Document",
        addFileButtonLabel: "Ajouter un arrêté de tarification",
      },
      CONVENTION: {
        categoryShortName: "convention",
        title: "Conventions",
        canAddFile: true,
        canAddAvenant: false,
        isOptional: true,
        shouldShow: true,
        additionalFieldsType: AdditionalFieldsType.DATE_START_END,
        documentLabel: "Document",
        addFileButtonLabel: "Ajouter une convention",
      },
    };
  }

  if (structure?.isSubventionnee) {
    return {
      CONVENTION: {
        categoryShortName: "convention",
        title: "Conventions",
        canAddFile: true,
        canAddAvenant: false,
        isOptional: false,
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
        notice: `Dans cette catégorie, vous avez la possibilité d'importer d'autres documents utiles à l'analyse de la structure (ex: Plans Pluriannuels d'Investissements)`,
      },
    };
  }

  return {};
};
