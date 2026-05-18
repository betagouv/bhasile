import {
  StructureTransformationApiCreate,
  StructureTransformationApiUpdate,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StructureType } from "@/types/structure.type";
import {
  StructureTransformationType,
  TransformationType,
} from "@/types/transformation.type";

export const getTransformationSteps = (
  transformation?: TransformationApiRead
): Step[] => {
  if (!transformation) {
    return [];
  }

  return (
    transformation.structureTransformations
      ?.map((structureTransformation) => {
        return {
          id: structureTransformation.id,
          codeBhasile: structureTransformation.structure?.codeBhasile,
          structureTransformationType:
            structureTransformation.structureTransformationType,
          steps: getStepsByType(structureTransformation, transformation.id),
        };
      })
      .sort((a, b) => {
        const typeOrder: Record<string, number> = {
          [StructureTransformationType.FERMETURE]: 0,
          [StructureTransformationType.CONTRACTION]: 1,
          [StructureTransformationType.EXTENSION]: 2,
          [StructureTransformationType.CREATION]: 3,
        };
        const aTypeOrder = a.structureTransformationType
          ? typeOrder[a.structureTransformationType]
          : 99;
        const bTypeOrder = b.structureTransformationType
          ? typeOrder[b.structureTransformationType]
          : 99;
        return aTypeOrder - bTypeOrder;
      }) ?? []
  );
};

const getStepsByType = (
  structureTransformation: StructureTransformationApiUpdate,
  transformationId: number
) => {
  if (!structureTransformation.structureTransformationType) {
    return [];
  }

  switch (structureTransformation.structureTransformationType) {
    case StructureTransformationType.EXTENSION:
    case StructureTransformationType.CONTRACTION:
    case StructureTransformationType.CREATION:
      return [
        {
          label: "Description",
          route: getRoute(
            "description",
            transformationId,
            structureTransformation.id,
            structureTransformation.structureTransformationType
          ),
        },
        {
          label: "Places et hébergement",
          route: getRoute(
            "places-et-hebergement",
            transformationId,
            structureTransformation.id,
            structureTransformation.structureTransformationType
          ),
        },
        {
          label: "Actes administratifs",
          route: getRoute(
            "actes-administratifs",
            transformationId,
            structureTransformation.id,
            structureTransformation.structureTransformationType
          ),
        },
      ];
    case StructureTransformationType.FERMETURE:
      return [
        {
          label: "Description",
          route: getRoute(
            "description",
            transformationId,
            structureTransformation.id,
            structureTransformation.structureTransformationType
          ),
        },
      ];
  }
};

const getRoute = (
  route: string,
  transformationId?: number,
  idStep?: number,
  structureTransformationType?: StructureTransformationType
) => {
  if (!transformationId || !idStep || !structureTransformationType || !route) {
    return "";
  }

  const types = {
    [StructureTransformationType.EXTENSION]: "extension",
    [StructureTransformationType.CONTRACTION]: "contraction",
    [StructureTransformationType.FERMETURE]: "fermeture",
    [StructureTransformationType.CREATION]: "creation",
  };

  return `/structures/transformation/${transformationId}/${types[structureTransformationType]}/${idStep}/${route}`;
};

export type Step = {
  id?: number;
  codeBhasile?: string;
  structureTransformationType?: StructureTransformationType;
  steps: {
    label: string;
    route: string;
  }[];
};

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
    blocks: [],
    buildAutoTransformations: () => [
      { structureTransformationType: StructureTransformationType.CREATION },
    ],
  },
  [TransformationType.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES]: {
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
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        structureId,
        structureTransformationType: StructureTransformationType.EXTENSION,
      },
    ],
  },
  [TransformationType.EXTENSION_DEPUIS_STRUCTURES_QUI_CONTRACTENT]: {
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
    blocks: [],
    buildAutoTransformations: (structureId) => [
      {
        structureId,
        structureTransformationType: StructureTransformationType.FERMETURE,
      },
    ],
  },
  [TransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR]: {
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
