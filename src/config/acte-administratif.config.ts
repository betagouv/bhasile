import type { ReactElement } from "react";

import { StructureApiRead } from "@/schemas/api/structure.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export enum AdditionalFieldsType {
  DATE_START_END,
  DATE,
  NAME,
}

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
      addFileButtonLabel: "Ajouter des statuts",
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
