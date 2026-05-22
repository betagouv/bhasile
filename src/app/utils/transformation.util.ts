import {
  StructureTransformationApiUpdate,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StructureTransformationType } from "@/types/transformation.type";

type GetTransformationFormNavigationProps = {
  transformationSteps: Step[];
  transformationStructureType: StructureTransformationType;
  transformationStructureId: number;
  transformationStructureStep: string;
};

export const getTransformationFormNavigation = ({
  transformationSteps,
  transformationStructureType,
  transformationStructureId,
  transformationStructureStep,
}: GetTransformationFormNavigationProps) => {
  const flatSteps = transformationSteps.flatMap((step) =>
    step.steps.map((stepItem) => ({
      id: step.id,
      type: step.type,
      ...stepItem,
    }))
  );

  const currentIndex = flatSteps.findIndex(
    (step) =>
      step.type?.toLowerCase() === transformationStructureType.toLowerCase() &&
      step.id === transformationStructureId &&
      step.name.toLowerCase() === transformationStructureStep.toLowerCase()
  );

  const firstStep = flatSteps[0];
  const currentStep = flatSteps[currentIndex];
  const prevStep = currentIndex > 0 ? flatSteps[currentIndex - 1] : undefined;
  const nextStep =
    currentIndex >= 0 && currentIndex < flatSteps.length - 1
      ? flatSteps[currentIndex + 1]
      : undefined;

  return { firstStep, currentStep, prevStep, nextStep };
};

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
          name: "description",
          label: "Description",
          route: getRoute(
            "description",
            transformationId,
            structureTransformation.id,
            structureTransformation.structureTransformationType
          ),
        },
        {
          name: "places-et-hebergement",
          label: "Places et hébergement",
          route: getRoute(
            "places-et-hebergement",
            transformationId,
            structureTransformation.id,
            structureTransformation.structureTransformationType
          ),
        },
        {
          name: "actes-administratifs",
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
          name: "description",
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
    name: string;
    label: string;
    route: string;
  }[];
};
