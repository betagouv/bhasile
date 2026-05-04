import prisma from "@/lib/prisma";
import {
  StructureTransformationApiType,
  TransformationApiCreation,
  TransformationApiWrite,
} from "@/schemas/api/transformation.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateAdresses } from "../adresses/adresse.repository";
import { createOrUpdateAntennes } from "../antennes/antenne.repository";
import { createOrUpdateContacts } from "../contacts/contact.repository";
import { createOrUpdateDnaStructureTransformations } from "../dna-structures/dna-structure-transformation.repository";
import { createOrUpdateFinesses } from "../finesses/finess.repository";
import { createOrUpdateForms } from "../forms/form.repository";
import { createOrUpdateStructureMillesimes } from "../structure-millesimes/structure-millesime.repository";
import { createOrUpdateStructureTypologies } from "../structure-typologies/structure-typologie.repository";
import { convertToPublicType } from "../structures/structure.util";

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

export const createTransformation = async (
  input: TransformationApiCreation
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
          type: structureTransformation.type,
          ...buildScalarData(structureTransformation),
        },
      });
    }

    return transformation.id;
  });
};

export const updateTransformation = async (
  input: TransformationApiWrite
): Promise<void> => {
  await prisma.$transaction(
    async (tx) => {
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
          await upsertStructureTransformation(
            tx,
            input.id,
            structureTransformation
          );
        }
      }
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
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

const buildScalarData = (
  structureTransformation: StructureTransformationApiType
) => ({
  date: structureTransformation.date ?? undefined,
  motif: structureTransformation.motif ?? undefined,
  public: convertToPublicType(structureTransformation.public),
  adresseAdministrative:
    structureTransformation.adresseAdministrative ?? undefined,
  codePostalAdministratif:
    structureTransformation.codePostalAdministratif ?? undefined,
  communeAdministrative:
    structureTransformation.communeAdministrative ?? undefined,
  departementAdministratif:
    structureTransformation.departementAdministratif ?? undefined,
  latitude: structureTransformation.latitude ?? undefined,
  longitude: structureTransformation.longitude ?? undefined,
  nom: structureTransformation.nom ?? undefined,
  placesAutorisees: structureTransformation.placesAutorisees ?? undefined,
  pmr: structureTransformation.pmr ?? undefined,
  lgbt: structureTransformation.lgbt ?? undefined,
  fvvTeh: structureTransformation.fvvTeh ?? undefined,
});

const upsertStructureTransformation = async (
  tx: PrismaTransaction,
  transformationId: number,
  structureTransformation: StructureTransformationApiType
): Promise<void> => {
  const scalarData = buildScalarData(structureTransformation);

  let structureTransformationId: number;
  if (structureTransformation.id) {
    const updated = await tx.structureTransformation.update({
      where: { id: structureTransformation.id },
      data: {
        ...scalarData,
        ...(structureTransformation.type !== undefined && {
          type: structureTransformation.type,
        }),
      },
    });
    structureTransformationId = updated.id;
  } else {
    if (!structureTransformation.structureId || !structureTransformation.type) {
      throw new Error(
        "structureId et type sont requis pour créer une structureTransformation"
      );
    }
    const created = await tx.structureTransformation.create({
      data: {
        transformationId,
        structureId: structureTransformation.structureId,
        type: structureTransformation.type,
        ...scalarData,
      },
    });
    structureTransformationId = created.id;
  }

  const entityId = { structureTransformationId };

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
