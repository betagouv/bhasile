import { StructureApiType } from "@/schemas/api/structure.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "./structure.util";

export const getCategoriesToDisplay = (
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
