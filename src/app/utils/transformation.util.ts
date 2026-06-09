import {
  STRUCTURE_VERSION_TRANSFORMATION_FORM_STEPS,
  STRUCTURE_VERSION_TRANSFORMATION_TYPE_ORDER,
  TRANSFORMATION_TYPE_SPECS,
  VERIFICATION_STEP_NAME,
} from "@/config/transformation.config";
import { CURRENT_YEAR } from "@/constants";
import { FormApiType } from "@/schemas/api/form.schema";
import {
  StructureVersionApiRead,
  StructureVersionTransformationApiRead,
  StructureVersionTransformationApiUpdate,
  TransformationApiRead,
} from "@/schemas/api/transformation.schema";
import { StepStatus } from "@/types/form.type";
import { DeepPartial, FormKind } from "@/types/global";
import {
  StructureVersionTransformationStep,
  StructureVersionTransformationType,
  TransformationFormType,
  TransformationType,
} from "@/types/transformation.type";

import { transformApiAdressesToFormAdresses } from "./adresse.util";
import { getYearFromDate } from "./date.util";
import {
  getMillesimeIndexForAYear,
  getMostRecentMillesime,
} from "./structure.util";

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

export const getStructureVersionTransformationDepartement = (
  structureVersionTransformation?: StructureVersionTransformationApiRead
): string | undefined =>
  structureVersionTransformation?.structureVersion?.departementAdministratif ??
  structureVersionTransformation?.structureVersion?.structure
    ?.departementAdministratif ??
  undefined;

export const getReferenceStructureVersionTransformation = (
  transformation: TransformationApiRead
): StructureVersionTransformationApiRead | undefined =>
  transformation.structureVersionTransformations.find(
    (structureVersionTransformation) =>
      getStructureVersionTransformationDepartement(
        structureVersionTransformation
      )
  ) ?? transformation.structureVersionTransformations[0];

export const getTransformationDepartement = (
  transformation: TransformationApiRead
): string | undefined =>
  getStructureVersionTransformationDepartement(
    getReferenceStructureVersionTransformation(transformation)
  );

type GetTransformationFormNavigationProps = {
  transformationSteps: Step[];
  transformationId: number;
  transformationStructureType?: StructureVersionTransformationType;
  transformationStructureId?: number;
  transformationStructureStep?: string;
};

export const getTransformationFormNavigation = ({
  transformationSteps,
  transformationId,
  transformationStructureType,
  transformationStructureId,
  transformationStructureStep,
}: GetTransformationFormNavigationProps) => {
  const flatSteps = [
    ...transformationSteps.flatMap((step) =>
      step.steps.map((stepItem) => ({
        id: step.id,
        type: step.type,
        ...stepItem,
      }))
    ),
    {
      id: undefined,
      type: undefined,
      name: VERIFICATION_STEP_NAME,
      label: "Vérification",
      route: `/structures/transformation/${transformationId}/verification`,
    },
  ];

  const currentIndex = flatSteps.findIndex((step) => {
    if (step.name === VERIFICATION_STEP_NAME) {
      return (
        transformationStructureStep?.toLowerCase() === VERIFICATION_STEP_NAME
      );
    }
    return (
      step.type?.toLowerCase() === transformationStructureType?.toLowerCase() &&
      step.id === transformationStructureId &&
      step.name.toLowerCase() === transformationStructureStep?.toLowerCase()
    );
  });

  const firstStep = flatSteps[0];
  const currentStep = flatSteps[currentIndex];
  const prevStep = currentIndex > 0 ? flatSteps[currentIndex - 1] : undefined;
  const nextStep =
    currentIndex >= 0 && currentIndex < flatSteps.length - 1
      ? flatSteps[currentIndex + 1]
      : undefined;

  return { firstStep, currentStep, prevStep, nextStep };
};

export const sortStructureVersionTransformationsByType = <
  T extends { type?: StructureVersionTransformationType },
>(
  items: T[]
): T[] => {
  return [...items].sort((firstItem, secondItem) => {
    const firstOrder = firstItem.type
      ? STRUCTURE_VERSION_TRANSFORMATION_TYPE_ORDER[firstItem.type]
      : Infinity;
    const secondOrder = secondItem.type
      ? STRUCTURE_VERSION_TRANSFORMATION_TYPE_ORDER[secondItem.type]
      : Infinity;
    return firstOrder - secondOrder;
  });
};

export const getTransformationSteps = (
  transformation?: TransformationApiRead
): Step[] => {
  if (!transformation) {
    return [];
  }

  return sortStructureVersionTransformationsByType(
    transformation.structureVersionTransformations?.map(
      (structureVersionTransformation) => ({
        id: structureVersionTransformation.id,
        codeBhasile:
          structureVersionTransformation.structureVersion?.structure
            ?.codeBhasile,
        type: structureVersionTransformation.type,
        steps: getStepsByType(
          structureVersionTransformation,
          transformation.id
        ),
      })
    ) ?? []
  );
};

const getStepsByType = (
  structureVersionTransformation: StructureVersionTransformationApiUpdate,
  transformationId: number
): Step["steps"] => {
  if (!structureVersionTransformation.type) {
    return [];
  }

  switch (structureVersionTransformation.type) {
    case StructureVersionTransformationType.EXTENSION:
    case StructureVersionTransformationType.CONTRACTION:
    case StructureVersionTransformationType.CREATION:
      return [
        {
          name: StructureVersionTransformationStep.DESCRIPTION,
          label: "Description",
          route: getRoute(
            StructureVersionTransformationStep.DESCRIPTION,
            transformationId,
            structureVersionTransformation.id,
            structureVersionTransformation.type
          ),
        },
        {
          name: StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT,
          label: "Places et hébergement",
          route: getRoute(
            StructureVersionTransformationStep.PLACES_ET_HEBERGEMENT,
            transformationId,
            structureVersionTransformation.id,
            structureVersionTransformation.type
          ),
        },
        {
          name: StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
          label: "Actes administratifs",
          route: getRoute(
            StructureVersionTransformationStep.ACTES_ADMINISTRATIFS,
            transformationId,
            structureVersionTransformation.id,
            structureVersionTransformation.type
          ),
        },
      ];
    case StructureVersionTransformationType.FERMETURE:
      return [
        {
          name: StructureVersionTransformationStep.DESCRIPTION,
          label: "Description",
          route: getRoute(
            StructureVersionTransformationStep.DESCRIPTION,
            transformationId,
            structureVersionTransformation.id,
            structureVersionTransformation.type
          ),
        },
      ];
  }
};

const getRoute = (
  route: string,
  transformationId?: number,
  idStep?: number,
  structureVersionTransformationType?: StructureVersionTransformationType
) => {
  if (
    !transformationId ||
    !idStep ||
    !structureVersionTransformationType ||
    !route
  ) {
    return "";
  }

  const types = {
    [StructureVersionTransformationType.EXTENSION]: "extension",
    [StructureVersionTransformationType.CONTRACTION]: "contraction",
    [StructureVersionTransformationType.FERMETURE]: "fermeture",
    [StructureVersionTransformationType.CREATION]: "creation",
  };

  return `/structures/transformation/${transformationId}/${types[structureVersionTransformationType]}/${idStep}/${route}`;
};

export type Step = {
  id?: number;
  codeBhasile?: string;
  type?: StructureVersionTransformationType;
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
  structureVersionTransformation: StructureVersionTransformationApiRead
): AdresseSource => {
  const structure = structureVersionTransformation.structureVersion?.structure;
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

const getEffectiveYear = (effectiveDate: string | null | undefined): number =>
  getYearFromDate(effectiveDate) || CURRENT_YEAR;

const resolveSourceTypologie = <T extends { year: number }>(
  typologies: T[] | undefined,
  year: number | undefined
): T | undefined => {
  if (!typologies?.length) {
    return undefined;
  }
  const index = getMillesimeIndexForAYear(typologies, year);
  return index >= 0 ? typologies[index] : getMostRecentMillesime(typologies);
};

export const getPlacesSource = (
  structureVersionTransformation: StructureVersionTransformationApiRead
): number => {
  const structureVersion = structureVersionTransformation.structureVersion;
  const typologies = structureVersion?.structure?.structureTypologies;
  const year = getEffectiveYear(structureVersion?.effectiveDate);
  return resolveSourceTypologie(typologies, year)?.placesAutorisees ?? 0;
};

export const buildTransformationTypologie = (
  structureVersion?: StructureVersionApiRead
) => {
  const typologies = structureVersion?.structureTypologies;
  const year = getEffectiveYear(structureVersion?.effectiveDate);
  const sourceTypologie = resolveSourceTypologie(typologies, year);
  return {
    year,
    placesAutorisees: sourceTypologie?.placesAutorisees,
    pmr: sourceTypologie?.pmr,
    lgbt: sourceTypologie?.lgbt,
    fvvTeh: sourceTypologie?.fvvTeh,
  };
};

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

export const getStructureVersionTransformationLabel = (
  type?: StructureVersionTransformationType,
  codeBhasile?: string
) => {
  const code = codeBhasile ?? "";
  switch (type) {
    case StructureVersionTransformationType.EXTENSION:
      return `Extension ${code}`;
    case StructureVersionTransformationType.CONTRACTION:
      return `Contraction ${code}`;
    case StructureVersionTransformationType.FERMETURE:
      return `Fermeture ${code}`;
    case StructureVersionTransformationType.CREATION:
      return `Nouvelle structure`;
    default:
      return "";
  }
};

export const validateStructureVersionTransformationFormStep = (
  form: FormApiType,
  stepToValidate: string
): FormApiType => {
  const formStepSpecs =
    STRUCTURE_VERSION_TRANSFORMATION_FORM_STEPS[form.formDefinition.name] ?? [];

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
