import { getActesAdministratifsDefaultValues } from "@/app/utils/acte-administratif.util";
import {
  getPlacesSource,
  getStepsByType,
  getStructureVersionTransformationFormKind,
  getTransformationActesAdministratifsCategoryDisplayRules,
  getTransformationDefaultValues,
  getTransformationSteps,
  Step,
} from "@/app/utils/transformation.util";
import {
  StructureVersionTransformationApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { actesAdministratifsTransformationSchema } from "@/schemas/forms/base/acteAdministratif.schema";
import { withDepartementAdministratifInPerimetre } from "@/schemas/forms/base/adresseAdministrative.schema";
import { creationIdentificationSchema } from "@/schemas/forms/transformation/creationIdentification.schema";
import { getPlacesEtHebergementSchema } from "@/schemas/forms/transformation/creationPlacesEtHebergement.schema";
import { fermetureSchema } from "@/schemas/forms/transformation/fermeture.schema";
import { transformationIdentificationSchema } from "@/schemas/forms/transformation/transformationIdentification.schema";
import { StepStatus } from "@/types/form.type";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
} from "@/types/transformation.type";

type CanUpdateDepartement = (departementAdministratif: string) => boolean;

export const getStructureVersionTransformationStepItems = (
  transformation: TransformationApiRead,
  structureVersionTransformation: StructureVersionTransformationApiRead,
  canUpdateDepartement: CanUpdateDepartement
): Step["steps"] =>
  getStepsByType(structureVersionTransformation, transformation.id).map(
    (stepItem) => ({
      ...stepItem,
      status: resolveStepStatus(
        isStepComplete(
          transformation,
          structureVersionTransformation,
          stepItem.name,
          canUpdateDepartement
        ),
        stepItem.status
      ),
    })
  );

export const getTransformationStepsWithStatus = (
  transformation: TransformationApiRead | undefined,
  canUpdateDepartement: CanUpdateDepartement
): Step[] => {
  if (!transformation) {
    return [];
  }
  return getTransformationSteps(transformation).map((step) => {
    const structureVersionTransformation =
      transformation.structureVersionTransformations.find(
        (structureVersionTransformationItem) =>
          structureVersionTransformationItem.id === step.id
      );
    return structureVersionTransformation
      ? {
          ...step,
          steps: getStructureVersionTransformationStepItems(
            transformation,
            structureVersionTransformation,
            canUpdateDepartement
          ),
        }
      : step;
  });
};

export const isStructureVersionTransformationComplete = (
  transformation: TransformationApiRead,
  structureVersionTransformation: StructureVersionTransformationApiRead,
  canUpdateDepartement: CanUpdateDepartement
): boolean =>
  getStructureVersionTransformationStepItems(
    transformation,
    structureVersionTransformation,
    canUpdateDepartement
  ).every((stepItem) => stepItem.status === StepStatus.VALIDE);

const resolveStepStatus = (
  isComplete: boolean,
  savedStatus: StepStatus
): StepStatus => {
  if (isComplete) {
    return StepStatus.VALIDE;
  }
  return savedStatus === StepStatus.VALIDE ? StepStatus.COMMENCE : savedStatus;
};

const isStepComplete = (
  transformation: TransformationApiRead,
  structureVersionTransformation: StructureVersionTransformationApiRead,
  stepName: string,
  canUpdateDepartement: CanUpdateDepartement
): boolean => {
  const defaultValues = getTransformationDefaultValues({
    transformation,
    structureVersionTransformation,
  });

  switch (stepName) {
    case StructureVersionTransformationStep.DESCRIPTION:
      return getDescriptionSchema(
        structureVersionTransformation.type,
        canUpdateDepartement
      ).safeParse(defaultValues).success;
    case StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT:
      return getPlacesEtHebergementSchema(
        getStructureVersionTransformationFormKind(
          transformation.type,
          structureVersionTransformation.type
        ),
        getPlacesSource(structureVersionTransformation)
      ).safeParse(defaultValues).success;
    case StructureVersionTransformationStep.ACTES_ADMINISTRATIFS:
      return actesAdministratifsTransformationSchema.safeParse({
        actesAdministratifs: getActesAdministratifsDefaultValues(
          structureVersionTransformation.actesAdministratifs,
          getTransformationActesAdministratifsCategoryDisplayRules(
            transformation,
            structureVersionTransformation
          )
        ),
      }).success;
    default:
      return false;
  }
};

const getDescriptionSchema = (
  type: StructureVersionTransformationType,
  canUpdateDepartement: CanUpdateDepartement
) => {
  switch (type) {
    case StructureVersionTransformationType.CREATION:
      return withDepartementAdministratifInPerimetre(
        creationIdentificationSchema,
        canUpdateDepartement
      );
    case StructureVersionTransformationType.FERMETURE:
      return fermetureSchema;
    default:
      return withDepartementAdministratifInPerimetre(
        transformationIdentificationSchema,
        canUpdateDepartement
      );
  }
};
