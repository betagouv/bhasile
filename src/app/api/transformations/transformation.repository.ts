import prisma from "@/lib/prisma";
import {
  StructureTransformationApiUpdate,
  TransformationApiCreate,
  TransformationApiUpdate,
} from "@/schemas/api/transformation.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acte-administratif.repository";
import {
  createOrUpdateForms,
  initializeStructureTransformationDefaultForms,
} from "../forms/form.repository";
import { createOrUpdateStructureVersion } from "../structure-versions/structure-version.repository";

//TODO: will change when integrating forms into transformation
const TRANSFORMATION_FORM_SLUG = "transformation-v1";

export const findOne = async (id: number) => {
  return prisma.transformation.findUniqueOrThrow({
    where: { id },
    include: {
      form: {
        include: {
          formDefinition: true,
          formSteps: {
            include: {
              stepDefinition: true,
            },
          },
        },
      },
      structureTransformations: {
        include: {
          operateur: { select: { id: true, name: true } },
          forms: {
            include: {
              formDefinition: true,
              formSteps: {
                include: { stepDefinition: true },
              },
            },
          },
          actesAdministratifs: {
            include: { fileUploads: true },
          },
          structureVersion: {
            include: {
              structure: {
                include: {
                  operateur: { select: { id: true, name: true } },
                  structureTypologies: {
                    orderBy: { year: "desc" },
                  },
                },
              },
              contacts: true,
              adresses: true,
              finesses: true,
              antennes: true,
              dnaStructures: {
                include: { dna: true },
              },
              structureTypologies: {
                orderBy: { year: "desc" },
              },
            },
          },
        },
      },
    },
  });
};

export const createOne = async (
  input: TransformationApiCreate
): Promise<number> => {
  return await prisma.$transaction(async (tx) => {
    const transformation = await tx.transformation.create({
      data: {
        type: input.type,
      },
    });

    await initializeTransformationForm(tx, transformation.id);

    for (const structureTransformation of input.structureTransformations) {
      await createOrUpdateStructureTransformation(
        tx,
        transformation.id,
        structureTransformation
      );
    }

    return transformation.id;
  });
};

export const updateOne = async (
  input: TransformationApiUpdate
): Promise<number> => {
  return await prisma.$transaction(async (tx) => {
    if (input.type !== undefined) {
      await tx.transformation.update({
        where: { id: input.id },
        data: { type: input.type },
      });
    }

    if (input.form) {
      await createOrUpdateForms(tx, [input.form], {
        transformationId: input.id,
      });
    }

    if (input.structureTransformations) {
      for (const structureTransformation of input.structureTransformations) {
        await createOrUpdateStructureTransformation(
          tx,
          input.id,
          structureTransformation
        );
      }
    }
    return input.id;
  });
};

const initializeTransformationForm = async (
  tx: PrismaTransaction,
  transformationId: number
): Promise<void> => {
  const formDefinition = await tx.formDefinition.findUnique({
    where: { slug: TRANSFORMATION_FORM_SLUG },
  });

  if (!formDefinition) {
    throw new Error(
      `FormDefinition with slug ${TRANSFORMATION_FORM_SLUG} not found`
    );
  }

  await tx.form.create({
    data: {
      formDefinitionId: formDefinition.id,
      transformationId,
      status: false,
    },
  });
};

export const deleteOne = async (id: number): Promise<void> => {
  await prisma.transformation.delete({ where: { id } });
};

const createOrUpdateStructureTransformation = async (
  tx: PrismaTransaction,
  transformationId: number,
  structureTransformation: StructureTransformationApiUpdate
): Promise<void> => {
  const structureTransformationId = structureTransformation.id
    ? await updateStructureTransformation(
        tx,
        transformationId,
        structureTransformation
      )
    : await createStructureTransformation(
        tx,
        transformationId,
        structureTransformation
      );

  if (structureTransformation.structureVersion) {
    await createOrUpdateStructureVersion(
      tx,
      structureTransformation.structureVersion,
      {
        structureId: structureTransformation.structureVersion.structureId,
        structureTransformationId,
      }
    );
  }

  await createOrUpdateForms(tx, structureTransformation.forms, {
    structureTransformationId,
  });

  await createOrUpdateActesAdministratifs(
    tx,
    structureTransformation.actesAdministratifs,
    { structureTransformationId }
  );
};

const createStructureTransformation = async (
  tx: PrismaTransaction,
  transformationId: number,
  structureTransformation: StructureTransformationApiUpdate
): Promise<number> => {
  if (!structureTransformation.type) {
    throw new Error("type est requis pour créer une structureTransformation");
  }
  const created = await tx.structureTransformation.create({
    data: {
      transformationId,
      type: structureTransformation.type,
      date: structureTransformation.date,
      motif: structureTransformation.motif,
      operateurId: structureTransformation.operateurId,
    },
  });

  await initializeStructureTransformationDefaultForms(
    tx,
    created.id,
    structureTransformation.type
  );

  return created.id;
};

const updateStructureTransformation = async (
  tx: PrismaTransaction,
  transformationId: number,
  structureTransformation: StructureTransformationApiUpdate
): Promise<number> => {
  const updated = await tx.structureTransformation.update({
    where: {
      id: structureTransformation.id,
      transformationId,
    },
    data: {
      type: structureTransformation.type,
      date: structureTransformation.date,
      motif: structureTransformation.motif,
      operateurId: structureTransformation.operateurId,
    },
  });
  return updated.id;
};
