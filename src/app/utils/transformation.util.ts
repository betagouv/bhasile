import {
  StructureTransformationApiType,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StructureTransformationType } from "@/types/transformation.type";

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
          codeBhasile: String(structureTransformation.structureId), // TODO: change TransformationApiRead to include codeBhasile
          type: structureTransformation.type,
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
        const aTypeOrder = a.type ? typeOrder[a.type] : 99;
        const bTypeOrder = b.type ? typeOrder[b.type] : 99;
        return aTypeOrder - bTypeOrder;
      }) ?? []
  );
};

const getStepsByType = (
  structureTransformation: StructureTransformationApiType,
  transformationId: number
) => {
  if (!structureTransformation.type) {
    return [];
  }

  switch (structureTransformation.type) {
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
            structureTransformation.type
          ),
        },
        {
          label: "Places et hébergement",
          route: getRoute(
            "places-et-hebergement",
            transformationId,
            structureTransformation.id,
            structureTransformation.type
          ),
        },
        {
          label: "Actes administratifs",
          route: getRoute(
            "actes-administratifs",
            transformationId,
            structureTransformation.id,
            structureTransformation.type
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
            structureTransformation.type
          ),
        },
      ];
  }
};

const getRoute = (
  route: string,
  transformationId?: number,
  idStep?: number,
  type?: StructureTransformationType
) => {
  if (!transformationId || !idStep || !type || !route) {
    return "";
  }

  const types = {
    [StructureTransformationType.EXTENSION]: "extension",
    [StructureTransformationType.CONTRACTION]: "contraction",
    [StructureTransformationType.FERMETURE]: "fermeture",
    [StructureTransformationType.CREATION]: "creation",
  };

  return `/structures/transformation/${transformationId}/${types[StructureTransformationType.EXTENSION]}/${idStep}/${route}`;
};

export type Step = {
  id?: number;
  codeBhasile?: string;
  type?: StructureTransformationType;
  steps: {
    label: string;
    route: string;
  }[];
};
