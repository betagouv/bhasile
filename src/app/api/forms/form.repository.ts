import { StructureVersionTransformationType } from "@/generated/prisma/enums";
import { FormApiType } from "@/schemas/api/form.schema";
import { EntityId } from "@/types/Entity.type";
import { StepStatus } from "@/types/form.type";
import { PrismaTransaction } from "@/types/prisma.type";

import {
  FINALISATION_FORM_SLUG,
  STRUCTURE_VERSION_TRANSFORMATION_FORM_SLUGS,
} from "./form.constants";
import { convertToStepStatus } from "./form.util";

export const createOrUpdateForms = async (
  tx: PrismaTransaction,
  forms: FormApiType[] | undefined,
  entityId: EntityId
): Promise<void> => {
  if (!forms || forms.length === 0) {
    return;
  }

  await Promise.all(
    forms.map(async (form) => {
      await createOrUpdateCompleteFormWithSteps(tx, entityId, form);
    })
  );
};

export const createOrUpdateForm = async (
  tx: PrismaTransaction,
  form: FormApiType | undefined,
  entityId: EntityId
): Promise<void> => {
  if (!form) {
    return;
  }
  await createOrUpdateCompleteFormWithSteps(tx, entityId, form);
};

const getFormUniqueWhere = (
  entityId: EntityId,
  formDefinitionId: number
):
  | {
      structureId_formDefinitionId: {
        structureId: number;
        formDefinitionId: number;
      };
    }
  | {
      structureVersionTransformationId: number;
    }
  | {
      transformationId_formDefinitionId: {
        transformationId: number;
        formDefinitionId: number;
      };
    } => {
  if (entityId.structureId !== undefined) {
    return {
      structureId_formDefinitionId: {
        structureId: entityId.structureId,
        formDefinitionId,
      },
    };
  }
  if (entityId.transformationId !== undefined) {
    return {
      transformationId_formDefinitionId: {
        transformationId: entityId.transformationId,
        formDefinitionId,
      },
    };
  }
  if (entityId.structureVersionTransformationId !== undefined) {
    return {
      structureVersionTransformationId:
        entityId.structureVersionTransformationId,
    };
  }
  throw new Error(
    "structureId, transformationId ou structureVersionTransformationId est requis pour un Form"
  );
};

const createOrUpdateCompleteFormWithSteps = async (
  tx: PrismaTransaction,
  entityId: EntityId,
  form: FormApiType
): Promise<void> => {
  // 1. Récupérer la FormDefinition par slug
  const formDefinition = await tx.formDefinition.findUnique({
    where: { slug: form.formDefinition.slug },
    include: { stepsDefinition: true },
  });

  if (!formDefinition) {
    throw new Error(
      `FormDefinition with slug ${form.formDefinition.slug} not found`
    );
  }

  // 2. Créer ou mettre à jour le Form
  const formEntity = await tx.form.upsert({
    where: getFormUniqueWhere(entityId, formDefinition.id),
    update: {
      status: form.status,
    },
    create: {
      ...entityId,
      formDefinitionId: formDefinition.id,
      status: form.status,
    },
  });

  // 3. Créer ou mettre à jour les FormSteps
  if (form.formSteps) {
    await Promise.all(
      form.formSteps.map(async (step) => {
        // 3.1. Récupérer le stepDefinition par slug
        const stepDefinition = formDefinition.stepsDefinition.find(
          (stepDefinition) => stepDefinition.slug === step.stepDefinition.slug
        );
        if (!stepDefinition) {
          throw new Error(
            `stepDefinition with slug ${step.stepDefinition.slug} not found`
          );
        }

        // 3.2. Créer ou mettre à jour le FormStep
        await tx.formStep.upsert({
          where: {
            formId_stepDefinitionId: {
              formId: formEntity.id,
              stepDefinitionId: stepDefinition.id,
            },
          },
          update: {
            status: convertToStepStatus(step.status),
          },
          create: {
            formId: formEntity.id,
            stepDefinitionId: stepDefinition.id,
            status: convertToStepStatus(step.status),
          },
        });
      })
    );
  }
};

export const initializeStructureDefaultForms = async (
  tx: PrismaTransaction,
  isOperateurUpdate: boolean,
  structureId: number
): Promise<void> => {
  if (!isOperateurUpdate) {
    return;
  }

  const formDefinition = await tx.formDefinition.findUnique({
    where: { slug: FINALISATION_FORM_SLUG },
    include: { stepsDefinition: true },
  });

  if (!formDefinition) {
    throw new Error(
      `FormDefinition with slug ${FINALISATION_FORM_SLUG} not found`
    );
  }

  const formEntity = await tx.form.create({
    data: {
      formDefinitionId: formDefinition.id,
      structureId,
      status: false,
    },
  });

  for (const stepDefinition of formDefinition.stepsDefinition) {
    let status: StepStatus = StepStatus.NON_COMMENCE;

    // Les deux premières étapes sont marquées "À vérifier"
    if (
      stepDefinition.slug === "01-identification" ||
      stepDefinition.slug === "02-documents-financiers"
    ) {
      status = StepStatus.A_VERIFIER;
    }

    await tx.formStep.create({
      data: {
        formId: formEntity.id,
        stepDefinitionId: stepDefinition.id,
        status: status,
      },
    });
  }
};

export const initializeStructureVersionTransformationDefaultForms = async (
  tx: PrismaTransaction,
  structureVersionTransformationId: number,
  structureVersionTransformationType: StructureVersionTransformationType
): Promise<void> => {
  const slug =
    STRUCTURE_VERSION_TRANSFORMATION_FORM_SLUGS[
      structureVersionTransformationType
    ];

  const formDefinition = await tx.formDefinition.findUnique({
    where: { slug },
    include: { stepsDefinition: true },
  });

  if (!formDefinition) {
    throw new Error(`FormDefinition with slug ${slug} not found`);
  }

  const formEntity = await tx.form.create({
    data: {
      formDefinitionId: formDefinition.id,
      structureVersionTransformationId,
      status: false,
    },
  });

  for (const stepDefinition of formDefinition.stepsDefinition) {
    await tx.formStep.create({
      data: {
        formId: formEntity.id,
        stepDefinitionId: stepDefinition.id,
        status: StepStatus.NON_COMMENCE,
      },
    });
  }
};
