import {
  AdditionalFieldsType,
  CategoryDisplayRules,
} from "@/config/acte-administratif.config";
import { StructureTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

export type StructureSelectionBlock = {
  id: string;
  multiple: boolean;
  type: StructureTransformationType;
  fixedType?: StructureType;
  inheritOperateurFrom?: string;
  inheritDepartementFrom?: string;
  label?: string;
};

export type TransformationTypeSpec = {
  title: string;
  blocks: StructureSelectionBlock[];
  buildAutoTransformations: (
    structureId?: number
  ) => StructureTransformationApiCreate[];
  primaryStructureTransformationType?: StructureTransformationType;
};

export const STRUCTURE_TRANSFORMATION_TYPE_ORDER: Record<
  StructureTransformationType,
  number
> = {
  [StructureTransformationType.FERMETURE]: 0,
  [StructureTransformationType.CONTRACTION]: 1,
  [StructureTransformationType.EXTENSION]: 2,
  [StructureTransformationType.CREATION]: 3,
};

export const TRANSFORMATION_TYPE_SPECS: Record<
  TransformationType,
  TransformationTypeSpec
> = {
  [TransformationType.OUVERTURE_EX_NIHILO]: {
    title: "Nouvelle structure",
    blocks: [],
    buildAutoTransformations: () => [
      { type: StructureTransformationType.CREATION },
    ],
  },
  [TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES]: {
    title: "Nouvelle structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        label: "Veuillez sélectionner la ou les structures qui ferment",
      },
    ],
    buildAutoTransformations: () => [
      { type: StructureTransformationType.CREATION },
    ],
  },
  [TransformationType.EXTENSION_EX_NIHILO]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.EXTENSION,
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.CONTRACTION,
        label:
          "Veuillez sélectionner la ou les structures dont sont issues les places",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.EXTENSION,
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        label:
          "Veuillez sélectionner la ou les structures dont sont issues les places",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.EXTENSION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.EXTENSION,
  },
  [TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.EXTENSION,
        label:
          "Veuillez sélectionner la ou les structures vers lesquelles les places sont transférées",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.CONTRACTION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.CONTRACTION,
  },
  [TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.CONTRACTION,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.CONTRACTION,
  },
  [TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES]:
    {
      title: "Transformer une structure",
      blocks: [
        {
          id: "main",
          multiple: true,
          type: StructureTransformationType.EXTENSION,
          label:
            "Veuillez sélectionner la ou les structures vers lesquelles les places sont transférées",
        },
      ],
      buildAutoTransformations: (structureId) => [
        {
          type: StructureTransformationType.FERMETURE,
          structureVersion: { structureId },
        },
      ],
      primaryStructureTransformationType: StructureTransformationType.FERMETURE,
    },
  [TransformationType.FERMETURE_SANS_TRANSFERT]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        type: StructureTransformationType.FERMETURE,
        structureVersion: { structureId },
      },
    ],
    primaryStructureTransformationType: StructureTransformationType.FERMETURE,
  },
  [TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
      {
        id: "cada",
        multiple: false,
        type: StructureTransformationType.EXTENSION,
        fixedType: StructureType.CADA,
        inheritOperateurFrom: "huda",
        inheritDepartementFrom: "huda",
        label: "Veuillez sélectionner le CADA qui fait l'objet d'une extension",
      },
    ],
    buildAutoTransformations: () => [],
  },
  [TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
    ],
    buildAutoTransformations: () => [
      {
        type: StructureTransformationType.CREATION,
        structureVersion: { type: StructureType.CADA },
      },
    ],
  },
  [TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
    ],
    buildAutoTransformations: () => [],
  },
};

export const getCreationActesAdministratifsCategoryToDisplay = (
  transformationType: TransformationType | undefined
): CategoryDisplayRules => ({
  ARRETE_AUTORISATION: {
    categoryShortName: "arrêté",
    title:
      transformationType === TransformationType.OUVERTURE_EX_NIHILO
        ? "Arrêté d'autorisation"
        : "Arrêté d'autorisation ou arrêté de fusion des structures",
    canAddFile: false,
    canAddAvenant: false,
    isOptional: false,
    shouldShow: true,
    additionalFieldsType: AdditionalFieldsType.DATE_START_END,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter un arrêté d'autorisation",
    alternativeCategories:
      transformationType === TransformationType.OUVERTURE_EX_NIHILO
        ? undefined
        : ["ARRETE_FUSION"],
  },
  CONVENTION: {
    categoryShortName: "convention",
    title: "Convention",
    canAddFile: false,
    canAddAvenant: false,
    isOptional: false,
    shouldShow: true,
    additionalFieldsType: AdditionalFieldsType.DATE_START_END,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter une convention",
  },
  ARRETE_TARIFICATION: {
    categoryShortName: "arrêté",
    title: "Arrêté de tarification",
    canAddFile: false,
    canAddAvenant: false,
    isOptional: false,
    shouldShow: true,
    additionalFieldsType: AdditionalFieldsType.DATE_START_END,
    documentLabel: "Document",
    addFileButtonLabel: "Ajouter un arrêté de tarification",
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
