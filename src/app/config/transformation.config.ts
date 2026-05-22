import { StructureTransformationApiCreate } from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

export type StructureSelectionBlock = {
  id: string;
  multiple: boolean;
  structureTransformationType: StructureTransformationType;
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
};

export const TRANSFORMATION_TYPE_SPECS: Record<
  TransformationType,
  TransformationTypeSpec
> = {
  [TransformationType.OUVERTURE_EX_NIHILO]: {
    title: "Nouvelle structure",
    blocks: [],
    buildAutoTransformations: () => [
      { structureTransformationType: StructureTransformationType.CREATION },
    ],
  },
  [TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES]: {
    title: "Nouvelle structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        structureTransformationType: StructureTransformationType.FERMETURE,
        label: "Veuillez sélectionner la ou les structures qui ferment",
      },
    ],
    buildAutoTransformations: () => [],
  },
  [TransformationType.EXTENSION_EX_NIHILO]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        structureId,
        structureTransformationType: StructureTransformationType.EXTENSION,
      },
    ],
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        structureTransformationType: StructureTransformationType.CONTRACTION,
        label:
          "Veuillez sélectionner la ou les structures dont sont issues les places",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        structureId,
        structureTransformationType: StructureTransformationType.EXTENSION,
      },
    ],
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        structureTransformationType: StructureTransformationType.FERMETURE,
        label:
          "Veuillez sélectionner la ou les structures dont sont issues les places",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        structureId,
        structureTransformationType: StructureTransformationType.EXTENSION,
      },
    ],
  },
  [TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE]: {
    title: "Transformer une structure",
    blocks: [
      {
        id: "main",
        multiple: true,
        structureTransformationType: StructureTransformationType.EXTENSION,
        label:
          "Veuillez sélectionner la ou les structures vers lesquelles les places sont transférées",
      },
    ],
    buildAutoTransformations: (structureId) => [
      {
        structureId,
        structureTransformationType: StructureTransformationType.CONTRACTION,
      },
    ],
  },
  [TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        structureId,
        structureTransformationType: StructureTransformationType.CONTRACTION,
      },
    ],
  },
  [TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES]:
    {
      title: "Transformer une structure",
      blocks: [
        {
          id: "main",
          multiple: true,
          structureTransformationType: StructureTransformationType.EXTENSION,
          label:
            "Veuillez sélectionner la ou les structures vers lesquelles les places sont transférées",
        },
      ],
      buildAutoTransformations: (structureId) => [
        {
          structureId,
          structureTransformationType: StructureTransformationType.FERMETURE,
        },
      ],
    },
  [TransformationType.FERMETURE_SANS_TRANSFERT]: {
    title: "Transformer une structure",
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        structureId,
        structureTransformationType: StructureTransformationType.FERMETURE,
      },
    ],
  },
  [TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        structureTransformationType: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
      {
        id: "cada",
        multiple: false,
        structureTransformationType: StructureTransformationType.EXTENSION,
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
        structureTransformationType: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
    ],
    buildAutoTransformations: () => [
      {
        structureTransformationType: StructureTransformationType.CREATION,
        type: StructureType.CADA,
      },
    ],
  },
  [TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES]: {
    title: "Transformer HUDA en CADA",
    blocks: [
      {
        id: "huda",
        multiple: true,
        structureTransformationType: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
        label: "Veuillez sélectionner le ou les HUDA qui ferment",
      },
    ],
    buildAutoTransformations: () => [],
  },
};
