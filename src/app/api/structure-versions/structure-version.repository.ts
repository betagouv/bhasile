import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import { Prisma } from "@/generated/prisma/client";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateAdresses } from "../adresses/adresse.repository";
import { createOrUpdateAntennes } from "../antennes/antenne.repository";
import { createOrUpdateContacts } from "../contacts/contact.repository";
import { createOrUpdateDnaStructures } from "../dna-structures/dna-structure.repository";
import { createOrUpdateStructureFinesses } from "../finesses/finess.repository";
import { convertToPublicType } from "../structures/structure.util";
import {
  checkCreatedStructureDepartement,
  checkNoDepartementAdministratifChange,
} from "./structure-version.util";

export const mirrorLegacyPlacesToBaseVersions = async (
  tx: PrismaTransaction,
  options: { structureId?: number } = {}
): Promise<number> => {
  const legacyTypologies = await tx.structureTypologie.findMany({
    where: {
      year: PLACES_VERSIONED_FROM_YEAR - 1,
      structureId: options.structureId ?? { not: null },
    },
    select: { structureId: true, placesAutorisees: true },
  });

  let alignedVersions = 0;
  for (const legacyTypologie of legacyTypologies) {
    if (legacyTypologie.structureId === null) {
      continue;
    }
    const { count } = await tx.structureVersion.updateMany({
      where: {
        structureId: legacyTypologie.structureId,
        structureVersionTransformationId: null,
      },
      data: { placesAutorisees: legacyTypologie.placesAutorisees },
    });
    alignedVersions += count;
  }
  return alignedVersions;
};

type StructureVersionParent = Pick<
  EntityId,
  "structureId" | "structureVersionTransformationId"
>;

const getScalarData = (version: StructureVersionApiType) => ({
  effectiveDate: version.effectiveDate ?? undefined,
  public: convertToPublicType(version.public),
  adresseAdministrative: version.adresseAdministrative ?? undefined,
  codePostalAdministratif: version.codePostalAdministratif ?? undefined,
  communeAdministrative: version.communeAdministrative ?? undefined,
  departementAdministratif: version.departementAdministratif ?? undefined,
  latitude: version.latitude ?? undefined,
  longitude: version.longitude ?? undefined,
  nom: version.nom ?? undefined,
  notes: version.notes ?? undefined,
  nomOfii: version.nomOfii ?? undefined,
  directionTerritoriale: version.directionTerritoriale ?? undefined,
  placesAutorisees: version.placesAutorisees ?? undefined,
});

const createOneStructureVersion = async (
  tx: PrismaTransaction,
  version: StructureVersionApiType,
  parent: StructureVersionParent
): Promise<number> => {
  if (
    parent.structureId === undefined &&
    parent.structureVersionTransformationId === undefined
  ) {
    throw new Error(
      "structureId ou structureVersionTransformationId est requis pour créer une StructureVersion"
    );
  }

  const data: Prisma.StructureVersionUncheckedCreateInput = {
    ...getScalarData(version),
    structureId: parent.structureId,
    structureVersionTransformationId: parent.structureVersionTransformationId,
  };

  const created = await tx.structureVersion.create({ data });

  await persistRelations(tx, version, created.id);

  return created.id;
};

const updateOneStructureVersion = async (
  tx: PrismaTransaction,
  version: StructureVersionApiType
): Promise<number> => {
  if (!version.id) {
    throw new Error("id est requis pour mettre à jour une StructureVersion");
  }

  const data: Prisma.StructureVersionUncheckedUpdateInput =
    getScalarData(version);

  await tx.structureVersion.update({
    where: { id: version.id },
    data,
  });

  await persistRelations(tx, version, version.id);

  return version.id;
};

const resolveTransformationBaseDepartement = async (
  tx: PrismaTransaction,
  structureVersionTransformationId: number
): Promise<string | null> => {
  const current = await tx.structureVersionTransformation.findUniqueOrThrow({
    where: { id: structureVersionTransformationId },
    select: {
      transformation: {
        select: {
          structureVersionTransformations: {
            where: { id: { not: structureVersionTransformationId } },
            select: {
              structureVersion: {
                select: {
                  departementAdministratif: true,
                  structure: { select: { departementAdministratif: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  for (const sibling of current.transformation
    .structureVersionTransformations) {
    const departement =
      sibling.structureVersion?.departementAdministratif ??
      sibling.structureVersion?.structure?.departementAdministratif ??
      null;
    if (departement != null) {
      return departement;
    }
  }

  return null;
};

export const createOrUpdateStructureVersion = async (
  tx: PrismaTransaction,
  version: StructureVersionApiType,
  parent: StructureVersionParent
): Promise<number> => {
  const structureId = version.structureId ?? parent.structureId;
  if (structureId !== undefined) {
    const structure = await tx.structure.findUnique({
      where: { id: structureId },
      select: { departementAdministratif: true },
    });
    checkNoDepartementAdministratifChange(
      structure?.departementAdministratif,
      version.departementAdministratif
    );
  } else if (parent.structureVersionTransformationId !== undefined) {
    const baseDepartement = await resolveTransformationBaseDepartement(
      tx,
      parent.structureVersionTransformationId
    );
    checkCreatedStructureDepartement(
      baseDepartement,
      version.departementAdministratif
    );
  }

  if (version.id) {
    return updateOneStructureVersion(tx, version);
  }

  if (parent.structureVersionTransformationId !== undefined) {
    const existing = await tx.structureVersion.findUnique({
      where: {
        structureVersionTransformationId:
          parent.structureVersionTransformationId,
      },
      select: { id: true },
    });
    if (existing) {
      return updateOneStructureVersion(tx, { ...version, id: existing.id });
    }
  }

  return createOneStructureVersion(tx, version, parent);
};

const persistRelations = async (
  tx: PrismaTransaction,
  version: StructureVersionApiType,
  structureVersionId: number
): Promise<void> => {
  const entityId: EntityId = { structureVersionId };

  await createOrUpdateContacts(tx, version.contacts, entityId);
  await createOrUpdateAdresses(tx, version.adresses, entityId);
  await createOrUpdateAntennes(tx, version.antennes, entityId);
  await createOrUpdateStructureFinesses(
    tx,
    version.structureFinesses,
    entityId
  );
  await createOrUpdateDnaStructures(tx, version.dnaStructures, entityId);
};
