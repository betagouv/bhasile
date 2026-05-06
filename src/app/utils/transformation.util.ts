import { StructureTransformationApiType } from "@/schemas/api/transformation.schema";
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
  inheritOperatorFrom?: string;
  inheritDepartementFrom?: string;
};

export type TransformationTypeSpec = {
  blocks: StructureSelectionBlock[];
  buildAutoTransformations: (
    structureId?: number
  ) => StructureTransformationApiType[];
};

export const TRANSFORMATION_TYPE_SPECS: Record<
  TransformationType,
  TransformationTypeSpec
> = {
  [TransformationType.OUVERTURE_EX_NIHILO]: {
    blocks: [],
    buildAutoTransformations: () => [
      { type: StructureTransformationType.CREATION },
    ],
  },
  [TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES]: {
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
      },
    ],
    buildAutoTransformations: () => [],
  },
  [TransformationType.EXTENSION_EX_NIHILO]: {
    blocks: [],
    buildAutoTransformations: (structureId) => [
      { structureId, type: StructureTransformationType.EXTENSION },
    ],
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT]: {
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.CONTRACTION,
      },
    ],
    buildAutoTransformations: (structureId) => [
      { structureId, type: StructureTransformationType.EXTENSION },
    ],
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_FERMENT]: {
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
      },
    ],
    buildAutoTransformations: (structureId) => [
      { structureId, type: StructureTransformationType.EXTENSION },
    ],
  },
  [TransformationType.CONTRACTION_AVEC_TRANSFERT_VERS_AUTRE_STRUCTURE]: {
    blocks: [
      {
        id: "main",
        multiple: true,
        type: StructureTransformationType.EXTENSION,
      },
    ],
    buildAutoTransformations: (structureId) => [
      { structureId, type: StructureTransformationType.CONTRACTION },
    ],
  },
  [TransformationType.CONTRACTION_SANS_TRANSFERT_DE_PLACES]: {
    blocks: [],
    buildAutoTransformations: (structureId) => [
      { structureId, type: StructureTransformationType.CONTRACTION },
    ],
  },
  [TransformationType.FERMETURE_AVEC_TRANSFERT_VERS_UNE_OU_PLUSIEURS_STRUCTURES]:
    {
      blocks: [
        {
          id: "main",
          multiple: true,
          type: StructureTransformationType.EXTENSION,
        },
      ],
      buildAutoTransformations: (structureId) => [
        { structureId, type: StructureTransformationType.FERMETURE },
      ],
    },
  [TransformationType.FERMETURE_SANS_TRANSFERT]: {
    blocks: [],
    buildAutoTransformations: (structureId) => [
      { structureId, type: StructureTransformationType.FERMETURE },
    ],
  },
  [TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR]: {
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
      },
      {
        id: "cada",
        multiple: false,
        type: StructureTransformationType.EXTENSION,
        fixedType: StructureType.CADA,
        inheritOperatorFrom: "huda",
      },
    ],
    buildAutoTransformations: () => [],
  },
  [TransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR]: {
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
      },
    ],
    buildAutoTransformations: () => [
      { type: StructureTransformationType.CREATION },
    ],
  },
  [TransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES]: {
    blocks: [
      {
        id: "huda",
        multiple: true,
        type: StructureTransformationType.FERMETURE,
        fixedType: StructureType.HUDA,
      },
    ],
    buildAutoTransformations: () => [],
  },
};
