import {
  STRUCTURE_TRANSFORMATION_TYPE_ORDER,
  TRANSFORMATION_TYPE_SPECS,
} from "@/app/config/transformation.config";
import {
  StructureTransformationApiRead,
  StructureTransformationApiUpdate,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { DeepPartial } from "@/types/global";
import {
  StructureTransformationStep,
  StructureTransformationType,
  TransformationFormType,
  TransformationType,
} from "@/types/transformation.type";

export const getTransformationTitle = (
  type: TransformationType | TransformationFormType | undefined
): string => {
  if (type && type in TRANSFORMATION_TYPE_SPECS) {
    return TRANSFORMATION_TYPE_SPECS[type as TransformationType].title;
  }
  if (type === TransformationFormType.HUDA) {
    return "Transformer HUDA en CADA";
  }
  if (type === TransformationFormType.CREATION) {
    return "Nouvelle structure";
  }
  return "Transformer une structure";
};

type GetTransformationFormNavigationProps = {
  transformationSteps: Step[];
  transformationStructureType?: StructureTransformationType;
  transformationStructureId?: number;
  transformationStructureStep?: string;
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
      step.type?.toLowerCase() === transformationStructureType?.toLowerCase() &&
      step.id === transformationStructureId &&
      step.name.toLowerCase() === transformationStructureStep?.toLowerCase()
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
          codeBhasile:
            structureTransformation.structureVersion?.structure?.codeBhasile,
          type: structureTransformation.type,
          steps: getStepsByType(structureTransformation, transformation.id),
        };
      })
      .sort((a, b) => {
        const aTypeOrder = STRUCTURE_TRANSFORMATION_TYPE_ORDER[a.type];
        const bTypeOrder = STRUCTURE_TRANSFORMATION_TYPE_ORDER[b.type];
        return aTypeOrder - bTypeOrder;
      }) ?? []
  );
};

const getStepsByType = (
  structureTransformation: StructureTransformationApiUpdate,
  transformationId: number
): Step["steps"] => {
  if (!structureTransformation.type) {
    return [];
  }

  switch (structureTransformation.type) {
    case StructureTransformationType.EXTENSION:
    case StructureTransformationType.CONTRACTION:
    case StructureTransformationType.CREATION:
      return [
        {
          name: StructureTransformationStep.DESCRIPTION,
          label: "Description",
          route: getRoute(
            StructureTransformationStep.DESCRIPTION,
            transformationId,
            structureTransformation.id,
            structureTransformation.type
          ),
        },
        {
          name: StructureTransformationStep.PLACES_ET_HEBERGEMENT,
          label: "Places et hébergement",
          route: getRoute(
            StructureTransformationStep.PLACES_ET_HEBERGEMENT,
            transformationId,
            structureTransformation.id,
            structureTransformation.type
          ),
        },
        {
          name: StructureTransformationStep.ACTES_ADMINISTRATIFS,
          label: "Actes administratifs",
          route: getRoute(
            StructureTransformationStep.ACTES_ADMINISTRATIFS,
            transformationId,
            structureTransformation.id,
            structureTransformation.type
          ),
        },
      ];
    case StructureTransformationType.FERMETURE:
      return [
        {
          name: StructureTransformationStep.DESCRIPTION,
          label: "Description",
          route: getRoute(
            StructureTransformationStep.DESCRIPTION,
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
  type?: StructureTransformationType;
  steps: {
    name: string;
    label: string;
    route: string;
  }[];
};

export const getStructureTransformationDefaultValues = <T>(
  structureTransformation: StructureTransformationApiRead
): DeepPartial<T> =>
  ({
    ...structureTransformation.structureVersion,
    id: undefined,
  }) as DeepPartial<T>;

export const getStructureTransformationLabel = (
  type?: StructureTransformationType,
  codeBhasile?: string
) => {
  const code = codeBhasile ?? "";
  switch (type) {
    case StructureTransformationType.EXTENSION:
      return `Extension ${code}`;
    case StructureTransformationType.CONTRACTION:
      return `Contraction ${code}`;
    case StructureTransformationType.FERMETURE:
      return `Fermeture ${code}`;
    case StructureTransformationType.CREATION:
      return `Nouvelle structure`;
    default:
      return "";
  }
};
