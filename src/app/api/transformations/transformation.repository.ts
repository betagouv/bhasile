import { ApiDomainError } from "@/app/utils/apiErrorResponse.util";
import {
  getNextBhasileCode,
  getNormalizedRegionCodeFromDepartement,
} from "@/app/utils/bhasile.util";
import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  StructureVersionTransformationApiUpdate,
  TransformationApiCreate,
  TransformationApiUpdate,
  TransformationSelectionApiUpdate,
} from "@/schemas/api/transformation.schema";
import { PrismaTransaction } from "@/types/prisma.type";
import { StructureVersionTransformationType } from "@/types/transformation.type";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acte-administratif.repository";
import { TRANSFORMATION_FORM_SLUG } from "../forms/form.constants";
import {
  createOrUpdateForm,
  initializeStructureVersionTransformationDefaultForms,
} from "../forms/form.repository";
import { createOrUpdateStructureVersion } from "../structure-versions/structure-version.repository";
import { transformationInclude } from "./transformation.db.type";

export const findOne = async (id: number) => {
  return prisma.transformation.findUniqueOrThrow({
    where: { id },
    include: transformationInclude,
  });
};

export const findAll = async () => {
  return prisma.transformation.findMany({
    where: { form: { status: false } },
    orderBy: { updatedAt: "desc" },
    include: transformationInclude,
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

    for (const structureVersionTransformation of input.structureVersionTransformations) {
      await createOrUpdateStructureVersionTransformation(
        tx,
        transformation.id,
        structureVersionTransformation
      );
    }

    return transformation.id;
  });
};

export const updateOne = async (
  input: TransformationApiUpdate
): Promise<number> => {
  return await prisma.$transaction(async (tx) => {
    const finalisedTransformation = await tx.transformation.findUniqueOrThrow({
      where: { id: input.id },
      select: { form: { select: { status: true } } },
    });

    if (finalisedTransformation.form?.status === true) {
      throw new ApiDomainError(
        "Impossible de modifier une transformation finalisée"
      );
    }

    const isFinalizing = input.form?.status === true;
    if (isFinalizing) {
      const structureVersionTransformations =
        await tx.structureVersionTransformation.findMany({
          where: { transformationId: input.id },
          select: { structureVersion: { select: { effectiveDate: true } } },
        });
      if (
        structureVersionTransformations.some(
          (structureVersionTransformation) =>
            !structureVersionTransformation.structureVersion?.effectiveDate
        )
      ) {
        throw new ApiDomainError(
          "Chaque transformation doit avoir une date d'effet avant la finalisation"
        );
      }

      const finalized = await tx.form.updateMany({
        where: { transformationId: input.id, status: false },
        data: { status: true },
      });
      if (finalized.count === 0) {
        throw new ApiDomainError(
        "Impossible de modifier une transformation finalisée"
      );
      }
    }

    if (input.type !== undefined) {
      await tx.transformation.update({
        where: { id: input.id },
        data: { type: input.type },
      });
    }

    await createOrUpdateForm(tx, input.form, {
      transformationId: input.id,
    });

    if (input.structureVersionTransformations) {
      for (const structureVersionTransformation of input.structureVersionTransformations) {
        await createOrUpdateStructureVersionTransformation(
          tx,
          input.id,
          structureVersionTransformation
        );
      }
    }

    if (isFinalizing) {
      await createStructuresForCreationBlocks(tx, input.id);
      await moveActesAdministratifsToStructures(tx, input.id);
      await endDnaStructuresForFermetureBlocks(tx, input.id);
      await setFermetureDates(tx, input.id);
    }

    return input.id;
  });
};

export const resetSelection = async (
  input: TransformationSelectionApiUpdate
): Promise<number> => {
  return await prisma.$transaction(async (tx) => {
    const finalisedTransformation = await tx.transformation.findUniqueOrThrow({
      where: { id: input.id },
      select: { form: { select: { status: true } } },
    });

    if (finalisedTransformation.form?.status === true) {
      throw new ApiDomainError(
        "Impossible de modifier une transformation finalisée"
      );
    }

    await tx.structureVersionTransformation.deleteMany({
      where: { transformationId: input.id },
    });

    await tx.transformation.update({
      where: { id: input.id },
      data: { type: input.type },
    });

    for (const structureVersionTransformation of input.structureVersionTransformations) {
      await createOrUpdateStructureVersionTransformation(
        tx,
        input.id,
        structureVersionTransformation
      );
    }

    return input.id;
  });
};

type CreationBlock = Prisma.StructureVersionTransformationGetPayload<{
  include: { structureVersion: true };
}>;

const createStructuresForCreationBlocks = async (
  tx: PrismaTransaction,
  transformationId: number
): Promise<void> => {
  const transformation = await tx.transformation.findUniqueOrThrow({
    where: { id: transformationId },
    include: {
      structureVersionTransformations: {
        include: { structureVersion: true },
      },
    },
  });

  const bhasileCounterCache = new Map<string, number>();

  const creationStructureVersionTransformations =
    transformation.structureVersionTransformations.filter(
      (structureVersionTransformation) =>
        structureVersionTransformation.type ===
        StructureVersionTransformationType.CREATION
    );

  for (const structureVersionTransformation of creationStructureVersionTransformations) {
    await createStructureFromCreationBlock(
      tx,
      structureVersionTransformation,
      bhasileCounterCache
    );
  }
};

const endDnaStructuresForFermetureBlocks = async (
  tx: PrismaTransaction,
  transformationId: number
): Promise<void> => {
  const fermetureBlocks = await tx.structureVersionTransformation.findMany({
    where: {
      transformationId,
      type: StructureVersionTransformationType.FERMETURE,
    },
    select: {
      structureVersion: { select: { id: true, effectiveDate: true } },
    },
  });

  for (const fermetureBlock of fermetureBlocks) {
    const { structureVersion } = fermetureBlock;
    if (!structureVersion?.effectiveDate) {
      continue;
    }

    await tx.dnaStructure.updateMany({
      where: { structureVersionId: structureVersion.id, endDate: null },
      data: { endDate: structureVersion.effectiveDate },
    });
  }
};

const moveActesAdministratifsToStructures = async (
  tx: PrismaTransaction,
  transformationId: number
): Promise<void> => {
  const structureVersionTransformations =
    await tx.structureVersionTransformation.findMany({
      where: { transformationId },
      select: { id: true, structureVersion: { select: { structureId: true } } },
    });

  for (const structureVersionTransformation of structureVersionTransformations) {
    const structureId =
      structureVersionTransformation.structureVersion?.structureId ?? null;

    if (!structureId) {
      throw new Error(
        `Transformation ${transformationId}, Structure Version Transformation ${structureVersionTransformation.id} : structure cible introuvable, actes non basculables`
      );
    }

    await tx.acteAdministratif.updateMany({
      where: {
        structureVersionTransformationId: structureVersionTransformation.id,
      },
      data: { structureId, structureVersionTransformationId: null },
    });
  }
};

const setFermetureDates = async (
  tx: PrismaTransaction,
  transformationId: number
): Promise<void> => {
  const fermetureBlocks = await tx.structureVersionTransformation.findMany({
    where: {
      transformationId,
      type: StructureVersionTransformationType.FERMETURE,
    },
    select: {
      id: true,
      structureVersion: {
        select: { structureId: true, effectiveDate: true },
      },
    },
  });

  for (const fermetureBlock of fermetureBlocks) {
    const structureId = fermetureBlock.structureVersion?.structureId ?? null;
    const effectiveDate =
      fermetureBlock.structureVersion?.effectiveDate ?? null;

    if (!structureId || !effectiveDate) {
      throw new Error(
        `Transformation ${transformationId}, Structure Version Transformation ${fermetureBlock.id} : fermeture sans structure ou date d'effet`
      );
    }

    await tx.structure.updateMany({
      where: { id: structureId, fermetureDate: null },
      data: { fermetureDate: effectiveDate },
    });
  }
};

const createStructureFromCreationBlock = async (
  tx: PrismaTransaction,
  structureVersionTransformation: CreationBlock,
  bhasileCounterCache: Map<string, number>
): Promise<void> => {
  const { structureVersion, operateurId, structureType } =
    structureVersionTransformation;

  if (!structureVersion) {
    throw new Error(
      `Bloc création ${structureVersionTransformation.id} : structureVersion manquante`
    );
  }

  if (structureVersion.structureId) {
    return;
  }

  if (!operateurId) {
    throw new ApiDomainError(
      "Un bloc de création doit avoir un opérateur avant la finalisation."
    );
  }

  if (!structureType) {
    throw new ApiDomainError(
      "Un bloc de création doit avoir un type de structure avant la finalisation."
    );
  }

  const regionCode = getNormalizedRegionCodeFromDepartement(
    structureVersion.departementAdministratif
  );

  if (!regionCode) {
    throw new Error(
      `Bloc création ${structureVersionTransformation.id} : région indérivable pour le département ${structureVersion.departementAdministratif}`
    );
  }

  const codeBhasile = await getNextBhasileCode(
    tx,
    regionCode,
    bhasileCounterCache
  );

  const structure = await tx.structure.create({
    data: {
      codeBhasile,
      operateurId,
      creationDate: structureVersion.effectiveDate,
      departementAdministratif: structureVersion.departementAdministratif,
      type: structureType,
    },
  });

  await tx.structureVersion.update({
    where: { id: structureVersion.id },
    data: { structureId: structure.id },
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

const createOrUpdateStructureVersionTransformation = async (
  tx: PrismaTransaction,
  transformationId: number,
  structureVersionTransformation: StructureVersionTransformationApiUpdate
): Promise<void> => {
  const structureVersionTransformationId = structureVersionTransformation.id
    ? await updateStructureVersionTransformation(
        tx,
        transformationId,
        structureVersionTransformation
      )
    : await createStructureVersionTransformation(
        tx,
        transformationId,
        structureVersionTransformation
      );

  if (structureVersionTransformation.structureVersion) {
    await createOrUpdateStructureVersion(
      tx,
      structureVersionTransformation.structureVersion,
      {
        structureId:
          structureVersionTransformation.structureVersion.structureId,
        structureVersionTransformationId,
      }
    );
  }

  await createOrUpdateForm(tx, structureVersionTransformation.form, {
    structureVersionTransformationId,
  });

  await createOrUpdateActesAdministratifs(
    tx,
    structureVersionTransformation.actesAdministratifs,
    { structureVersionTransformationId }
  );
};

const createStructureVersionTransformation = async (
  tx: PrismaTransaction,
  transformationId: number,
  structureVersionTransformation: StructureVersionTransformationApiUpdate
): Promise<number> => {
  if (!structureVersionTransformation.type) {
    throw new Error(
      "type est requis pour créer une structureVersionTransformation"
    );
  }
  const created = await tx.structureVersionTransformation.create({
    data: {
      transformationId,
      type: structureVersionTransformation.type,
      motif: structureVersionTransformation.motif,
      operateurId: structureVersionTransformation.operateurId,
      structureType: structureVersionTransformation.structureType,
    },
  });

  await initializeStructureVersionTransformationDefaultForms(
    tx,
    created.id,
    structureVersionTransformation.type
  );

  return created.id;
};

const updateStructureVersionTransformation = async (
  tx: PrismaTransaction,
  transformationId: number,
  structureVersionTransformation: StructureVersionTransformationApiUpdate
): Promise<number> => {
  const updated = await tx.structureVersionTransformation.update({
    where: {
      id: structureVersionTransformation.id,
      transformationId,
    },
    data: {
      type: structureVersionTransformation.type,
      motif: structureVersionTransformation.motif,
      operateurId: structureVersionTransformation.operateurId,
      structureType: structureVersionTransformation.structureType,
    },
  });
  return updated.id;
};
