import prisma from "@/lib/prisma";
import {
  StructureTransformationApiUpdate,
  TransformationApiCreate,
  TransformationApiUpdate,
} from "@/schemas/api/transformation.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateAdresses } from "../adresses/adresse.repository";
import { createOrUpdateAntennes } from "../antennes/antenne.repository";
import { createOrUpdateContacts } from "../contacts/contact.repository";
import { createOrUpdateDnaStructureTransformations } from "../dna-structure-transformations/dna-structure-transformation.repository";
import { createOrUpdateFinesses } from "../finesses/finess.repository";
import {
  createOrUpdateForms,
  initializeStructureTransformationDefaultForms,
} from "../forms/form.repository";
import { createOrUpdateStructureMillesimes } from "../structure-millesimes/structure-millesime.repository";
import { createOrUpdateStructureTypologies } from "../structure-typologies/structure-typologie.repository";
import { convertToPublicType } from "../structures/structure.util";

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
          structure: true,
          contacts: true,
          adresses: {
            include: {
              adresseTypologies: {
                orderBy: { year: "desc" },
              },
            },
          },
          finesses: true,
          antennes: true,
          dnas: {
            include: { dna: true },
          },
          structureTypologies: {
            orderBy: { year: "desc" },
          },
          structureMillesimes: {
            orderBy: { year: "desc" },
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
      await tx.structureTransformation.create({
        data: {
          transformationId: transformation.id,
          structureId: structureTransformation.structureId,
          structureTransformationType:
            structureTransformation.structureTransformationType,
          ...getScalarData(structureTransformation),
        },
      });
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

const getScalarData = (
  structureTransformation: StructureTransformationApiUpdate
) => ({
  structureTransformationDate:
    structureTransformation.structureTransformationDate ?? undefined,
  structureTransformationMotif:
    structureTransformation.structureTransformationMotif ?? undefined,
  type: structureTransformation.type ?? undefined,
  public: convertToPublicType(structureTransformation.public),
  adresseAdministrative:
    structureTransformation.adresseAdministrative ?? undefined,
  codePostalAdministratif:
    structureTransformation.codePostalAdministratif ?? undefined,
  communeAdministrative:
    structureTransformation.communeAdministrative ?? undefined,
  departementAdministratif:
    structureTransformation.departementAdministratif ?? undefined,
  nom: structureTransformation.nom ?? undefined,
  placesAutorisees: structureTransformation.placesAutorisees ?? undefined,
  pmr: structureTransformation.pmr ?? undefined,
  lgbt: structureTransformation.lgbt ?? undefined,
  fvvTeh: structureTransformation.fvvTeh ?? undefined,
});

export const deleteOne = async (id: number): Promise<void> => {
  await prisma.$transaction(async (tx) => {
    await tx.transformation.delete({ where: { id } });
  });
};

const createOrUpdateStructureTransformation = async (
  tx: PrismaTransaction,
  transformationId: number,
  structureTransformation: StructureTransformationApiUpdate
): Promise<void> => {
  const scalarData = getScalarData(structureTransformation);

  const isCreation = !!structureTransformation.id;

  let structureTransformationId: number;

  if (isCreation) {
    if (!structureTransformation.structureTransformationType) {
      throw new Error(
        "structureTransformationType est requis pour créer une structureTransformation"
      );
    }
    const created = await tx.structureTransformation.create({
      data: {
        transformationId,
        structureId: structureTransformation.structureId,
        structureTransformationType:
          structureTransformation.structureTransformationType,
        ...scalarData,
      },
    });
    structureTransformationId = created.id;
  } else {
    const updated = await tx.structureTransformation.update({
      where: {
        id: structureTransformation.id,
        transformationId,
      },
      data: {
        ...scalarData,
        ...(structureTransformation.type !== undefined && {
          type: structureTransformation.type,
        }),
      },
    });
    structureTransformationId = updated.id;
  }

  const entityId = { structureTransformationId };

  if (isCreation && structureTransformation.structureTransformationType) {
    await initializeStructureTransformationDefaultForms(
      tx,
      structureTransformationId,
      structureTransformation.structureTransformationType
    );
  }

  await createOrUpdateForms(
    tx,
    structureTransformation.structureTransformationForms,
    entityId
  );
  await createOrUpdateContacts(tx, structureTransformation.contacts, entityId);
  await createOrUpdateAdresses(tx, structureTransformation.adresses, entityId);
  await createOrUpdateAntennes(tx, structureTransformation.antennes, entityId);
  await createOrUpdateFinesses(tx, structureTransformation.finesses, entityId);
  await createOrUpdateStructureTypologies(
    tx,
    structureTransformation.structureTypologies,
    entityId
  );
  await createOrUpdateStructureMillesimes(
    tx,
    structureTransformation.structureMillesimes,
    entityId
  );
  await createOrUpdateDnaStructureTransformations(
    tx,
    structureTransformation.dnas,
    structureTransformationId
  );
};
