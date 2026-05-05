import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { StructureTransformationType } from "@/types/transformation.type";

export const getTransformationSteps = (
  transformation?: TransformationApiRead
): Step[] => {
  if (!transformation) {
    return [];
  }

  return (
    transformation.structureTransformations?.map((structureTransformation) => {
      return {
        id: structureTransformation.id,
        codeBhasile: String(structureTransformation.structureId), // TODO: change TransformationApiRead to include codeBhasile
        type: structureTransformation.type,
        steps: getStepsByType(structureTransformation.type),
      };
    }) ?? []
  );
};

const getStepsByType = (type?: StructureTransformationType) => {
  if (!type) {
    return [];
  }

  switch (type) {
    case StructureTransformationType.EXTENSION:
    case StructureTransformationType.CONTRACTION:
    case StructureTransformationType.CREATION:
      return [
        {
          label: "Description",
          route: "description",
        },
        {
          label: "Places et hébergement",
          route: "places-et-hebergement",
        },
        {
          label: "Actes administratifs",
          route: "actes-administratifs",
        },
      ];
    case StructureTransformationType.FERMETURE:
      return [
        {
          label: "Description",
          route: "description",
        },
      ];
  }
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
