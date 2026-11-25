import { getActesAdministratifsDefaultValues } from "@/app/utils/acte-administratif.util";
import {
  getPlacesSource,
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

export const getTransformationStepsWithStatus = (
  transformation: TransformationApiRead | undefined,
  canUpdateDepartement: CanUpdateDepartement
): Step[] =>
  getTransformationSteps(transformation).map((step) => {
    const structureVersionTransformation =
      transformation?.structureVersionTransformations.find(
        ({ id }) => id === step.id
      );
    if (!transformation || !structureVersionTransformation) {
      return step;
    }
    const isStepComplete = getStepCompleteness(
      transformation,
      structureVersionTransformation,
      canUpdateDepartement
    );
    return {
      ...step,
      steps: step.steps.map((stepItem) => ({
        ...stepItem,
        status: getStepStatus(isStepComplete(stepItem.name), stepItem.status),
      })),
    };
  });

const getStepStatus = (
  isComplete: boolean,
  savedStatus: StepStatus
): StepStatus => {
  if (isComplete) {
    return StepStatus.VALIDE;
  }
  return savedStatus === StepStatus.NON_COMMENCE
    ? StepStatus.NON_COMMENCE
    : StepStatus.COMMENCE;
};

const getStepCompleteness = (
  transformation: TransformationApiRead,
  structureVersionTransformation: StructureVersionTransformationApiRead,
  canUpdateDepartement: CanUpdateDepartement
) => {
  const defaultValues = getTransformationDefaultValues({
    transformation,
    structureVersionTransformation,
  });

  return (stepName: string): boolean => {
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
};

const getDescriptionSchema = (
  type: StructureVersionTransformationType,
  canUpdateDepartement: CanUpdateDepartement
) => {
  switch (type) {
    case StructureVersionTransformationType.FERMETURE:
      return fermetureSchema;
    case StructureVersionTransformationType.CREATION:
      return withDepartementAdministratifInPerimetre(
        creationIdentificationSchema,
        canUpdateDepartement
      );
    default:
      return withDepartementAdministratifInPerimetre(
        transformationIdentificationSchema,
        canUpdateDepartement
      );
  }
};
