import { isStructureAutorisee } from "@/app/utils/structure.util";
import {
  AdditionalFieldsType,
  CategoryDisplayRules,
} from "@/config/acte-administratif.config";
import { StructureType } from "@/types/structure.type";

export const getCpomActesAdministratifsCategoryToDisplay = (
  structureType: StructureType
): CategoryDisplayRules => {
  const isAutorisee = isStructureAutorisee(structureType);

  return {
    ARRETE_AUTORISATION: {
      categoryShortName: "arrêté",
      title: "Arrêtés d'autorisation",
      canAddFile: true,
      canAddAvenant: true,
      isOptional: true,
      shouldShow: isAutorisee,
      additionalFieldsType: AdditionalFieldsType.DATE_START_END,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un arrêté d'autorisation",
    },
    ARRETE_TARIFICATION: {
      categoryShortName: "arrêté",
      title: "Arrêtés de tarification",
      canAddFile: true,
      canAddAvenant: true,
      isOptional: true,
      shouldShow: isAutorisee,
      additionalFieldsType: AdditionalFieldsType.DATE_START_END,
      documentLabel: "Document",
      addFileButtonLabel: "Ajouter un arrêté de tarification",
    },
    CONVENTION: {
      categoryShortName: "convention",
      title: "Conventions",
      canAddFile: true,
      canAddAvenant: true,
      isOptional: true,
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
    },
  };
};
