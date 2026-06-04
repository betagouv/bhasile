import {
  STRUCTURE_TRANSFORMATION_FORM_STEPS,
  STRUCTURE_TRANSFORMATION_TYPE_ORDER,
  TRANSFORMATION_TYPE_SPECS,
} from "@/config/transformation.config";
import { FormApiType } from "@/schemas/api/form.schema";
import {
  StructureTransformationApiRead,
  StructureTransformationApiUpdate,
  StructureVersionApiRead,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import { DeepPartial, FormKind } from "@/types/global";
import {
  StructureTransformationStep,
  StructureTransformationType,
  TransformationFormType,
  TransformationType,
} from "@/types/transformation.type";

import { transformApiAdressesToFormAdresses } from "./adresse.util";

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

export type AdresseSource = {
  nom: string;
  adresseAdministrative: string;
  adresseAdministrativeComplete: string;
  codePostalAdministratif: string;
  communeAdministrative: string;
  departementAdministratif: string;
};

export const getAdresseSource = (
  structureTransformation: StructureTransformationApiRead
): AdresseSource => {
  const structure = structureTransformation.structureVersion?.structure;
  return {
    nom: structure?.nom ?? "",
    adresseAdministrative: structure?.adresseAdministrative ?? "",
    adresseAdministrativeComplete:
      structure?.adresseAdministrativeComplete ?? "",
    codePostalAdministratif: structure?.codePostalAdministratif ?? "",
    communeAdministrative: structure?.communeAdministrative ?? "",
    departementAdministratif: structure?.departementAdministratif ?? "",
  };
};

export const getPlacesSource = (
  structureTransformation: StructureTransformationApiRead
): number =>
  structureTransformation.structureVersion?.structure?.structureTypologies?.[0]
    ?.placesAutorisees ?? 0;

export const getTransformationStructureVersionDefaultValues = <T>(
  structureVersion?: StructureVersionApiRead
): DeepPartial<T> =>
  ({
    ...structureVersion,
    adresses: transformApiAdressesToFormAdresses(structureVersion?.adresses),
  }) as DeepPartial<T>;

export const isCreation = (formKind: FormKind): boolean =>
  formKind === FormKind.OUVERTURE_EX_NIHILO ||
  formKind === FormKind.OUVERTURE_DEPUIS_UNE_OU_PLUSIEURS_STRUCTURES;

export const isTransformationSurStructureExistante = (
  formKind: FormKind
): boolean =>
  formKind === FormKind.EXTENSION || formKind === FormKind.CONTRACTION;

export const getTransformationNounAvecArticle = (
  formKind: FormKind
): string => {
  if (formKind === FormKind.EXTENSION) {
    return "l’extension";
  }
  if (formKind === FormKind.CONTRACTION) {
    return "la contraction";
  }
  return "";
};

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

export const validateStructureTransformationFormStep = (
  form: FormApiType,
  stepToValidate: string
): FormApiType => {
  const formStepSpecs =
    STRUCTURE_TRANSFORMATION_FORM_STEPS[form.formDefinition.name] ?? [];

  const stepSlugToValidate = formStepSpecs.find(
    (formStepSpec) => formStepSpec.name === stepToValidate
  )?.slug;

  if (!stepSlugToValidate) {
    return form;
  }

  return {
    ...form,
    formSteps: form.formSteps.map((formStep) =>
      formStep.stepDefinition.slug === stepSlugToValidate
        ? { ...formStep, status: StepStatus.VALIDE }
        : formStep
    ),
  };
};
