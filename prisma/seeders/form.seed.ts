import { fakerFR as faker } from "@faker-js/faker";

import {
  Form,
  FormDefinition,
  FormStep,
  FormStepDefinition,
  StepStatus,
} from "@/generated/prisma/client";

export const createFakeFormTransformation = (): Omit<FormDefinition, "id"> => {
  return {
    name: "transformation",
    slug: "transformation-v1",
    version: 1,
  };
};
export const createFakeFormFinalisation = (): Omit<FormDefinition, "id"> => {
  return {
    name: "finalisation",
    slug: "finalisation-v1",
    version: 1,
  };
};
export const createFakeFormStructureVersionTransformationCreation = (): Omit<
  FormDefinition,
  "id"
> => {
  return {
    name: "structure-transformation-creation",
    slug: "structure-transformation-creation-v1",
    version: 1,
  };
};
export const createFakeFormStructureVersionTransformationExtension = (): Omit<
  FormDefinition,
  "id"
> => {
  return {
    name: "structure-transformation-extension",
    slug: "structure-transformation-extension-v1",
    version: 1,
  };
};
export const createFakeFormStructureVersionTransformationContraction = (): Omit<
  FormDefinition,
  "id"
> => {
  return {
    name: "structure-transformation-contraction",
    slug: "structure-transformation-contraction-v1",
    version: 1,
  };
};
export const createFakeFormStructureVersionTransformationFermeture = (): Omit<
  FormDefinition,
  "id"
> => {
  return {
    name: "structure-transformation-fermeture",
    slug: "structure-transformation-fermeture-v1",
    version: 1,
  };
};

export const createFakeFinalisationFormStepDefinition = (
  formDefinitionId: number
): Omit<FormStepDefinition, "id">[] => {
  return [
    {
      formDefinitionId,
      label: "01-identification",
      slug: "01-identification",
    },
    {
      formDefinitionId,
      label: "02-documents-financiers",
      slug: "02-documents-financiers",
    },
    {
      formDefinitionId,
      label: "03-finance",
      slug: "03-finance",
    },
    {
      formDefinitionId,
      label: "04-controles",
      slug: "04-controles",
    },
    {
      formDefinitionId,
      label: "05-documents",
      slug: "05-documents",
    },
    {
      formDefinitionId,
      label: "06-notes",
      slug: "06-notes",
    },
  ];
};

export const createFakeStructureVersionTransformationCreationFormStepDefinition = (
  formDefinitionId: number
): Omit<FormStepDefinition, "id">[] => {
  return [
    {
      formDefinitionId,
      label: "01-identification",
      slug: "01-identification",
    },
    {
      formDefinitionId,
      label: "02-places-hebergement",
      slug: "02-places-hebergement",
    },
    {
      formDefinitionId,
      label: "03-actes-administratifs",
      slug: "03-actes-administratifs",
    },
  ];
};

export const createFakeStructureVersionTransformationFermetureFormStepDefinition = (
  formDefinitionId: number
): Omit<FormStepDefinition, "id">[] => {
  return [
    {
      formDefinitionId,
      label: "01-identification",
      slug: "01-identification",
    },
  ];
};

export const createFakeForm = (
  formDefinitionId: number
): Omit<
  Form,
  | "id"
  | "structureCodeDna"
  | "structureId"
  | "transformationId"
  | "structureVersionTransformationId"
> => {
  return {
    formDefinitionId: formDefinitionId,
    status: faker.datatype.boolean(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};

const createFakeFormStep = (
  stepDefinitionId: number,
  statusOverride?: StepStatus
): Omit<FormStep, "id" | "formId"> => {
  return {
    stepDefinitionId: stepDefinitionId,
    status: statusOverride ?? faker.helpers.enumValue(StepStatus),
    createdAt: faker.date.past(),
    updatedAt: faker.date.past(),
  };
};

type FormWithSteps = Form & {
  formSteps: Omit<FormStep, "id" | "formId">[];
};

export const createFakeFormWithSteps = (
  formDefinitionId: number,
  stepDefinitions: { id: number; slug: string }[],
  options?: { isFinalised?: boolean }
): Omit<
  FormWithSteps,
  | "id"
  | "structureCodeDna"
  | "structureId"
  | "transformationId"
  | "structureVersionTransformationId"
> => {
  const fakeForm = createFakeForm(formDefinitionId);
  const isFinalised = options?.isFinalised ?? false;
  const verificationSlugs = ["01-identification", "02-documents-financiers"];

  return {
    ...fakeForm,
    formSteps: stepDefinitions.map(({ id, slug }) => {
      const isVerification = verificationSlugs.includes(slug);
      const targetStatus = isFinalised
        ? StepStatus.VALIDE
        : isVerification
          ? StepStatus.A_VERIFIER
          : StepStatus.NON_COMMENCE;
      return createFakeFormStep(id, targetStatus);
    }),
  };
};
