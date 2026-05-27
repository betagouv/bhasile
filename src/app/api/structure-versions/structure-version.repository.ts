import { Prisma } from "@/generated/prisma/client";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import { EntityId } from "@/types/Entity.type";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateAdresses } from "../adresses/adresse.repository";
import { createOrUpdateAntennes } from "../antennes/antenne.repository";
import { createOrUpdateContacts } from "../contacts/contact.repository";
import { createOrUpdateDnaStructures } from "../dna-structures/dna-structure.repository";
import { createOrUpdateFinesses } from "../finesses/finess.repository";
import { createOrUpdateStructureTypologies } from "../structure-typologies/structure-typologie.repository";
import { convertToPublicType } from "../structures/structure.util";

type StructureVersionParent = Pick<
  EntityId,
  "structureId" | "structureTransformationId"
>;

const getScalarData = (version: StructureVersionApiType) => ({
  effectiveDate: version.effectiveDate ?? undefined,
  forceHistorize: version.forceHistorize ?? undefined,
  type: version.type ?? undefined,
  public: convertToPublicType(version.public),
  adresseAdministrative: version.adresseAdministrative ?? undefined,
  codePostalAdministratif: version.codePostalAdministratif ?? undefined,
  communeAdministrative: version.communeAdministrative ?? undefined,
  departementAdministratif: version.departementAdministratif ?? undefined,
  latitude: version.latitude ?? undefined,
  longitude: version.longitude ?? undefined,
  nom: version.nom ?? undefined,
  creationDate: version.creationDate ?? undefined,
  date303: version.date303 ?? undefined,
  lgbt: version.lgbt ?? undefined,
  fvvTeh: version.fvvTeh ?? undefined,
  notes: version.notes ?? undefined,
  nomOfii: version.nomOfii ?? undefined,
  directionTerritoriale: version.directionTerritoriale ?? undefined,
});

export const createOneStructureVersion = async (
  tx: PrismaTransaction,
  version: StructureVersionApiType,
  parent: StructureVersionParent
): Promise<number> => {
  if (
    parent.structureId === undefined &&
    parent.structureTransformationId === undefined
  ) {
    throw new Error(
      "structureId ou structureTransformationId est requis pour créer une StructureVersion"
    );
  }

  const effectiveDate = version.effectiveDate ?? new Date().toISOString();

  const data: Prisma.StructureVersionUncheckedCreateInput = {
    ...getScalarData(version),
    effectiveDate,
    structureId: parent.structureId,
    structureTransformationId: parent.structureTransformationId,
  };

  const created = await tx.structureVersion.create({ data });

  await persistRelations(tx, version, created.id);

  return created.id;
};

export const updateOneStructureVersion = async (
  tx: PrismaTransaction,
  version: StructureVersionApiType
): Promise<number> => {
  if (!version.id) {
    throw new Error("id est requis pour mettre à jour une StructureVersion");
  }

  const data: Prisma.StructureVersionUncheckedUpdateInput = getScalarData(version);

  await tx.structureVersion.update({
    where: { id: version.id },
    data,
  });

  await persistRelations(tx, version, version.id);

  return version.id;
};

export const createOrUpdateStructureVersion = async (
  tx: PrismaTransaction,
  version: StructureVersionApiType,
  parent: StructureVersionParent
): Promise<number> => {
  if (version.id) {
    return updateOneStructureVersion(tx, version);
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
  await createOrUpdateFinesses(tx, version.finesses, entityId);
  await createOrUpdateStructureTypologies(
    tx,
    version.structureTypologies,
    entityId
  );
  await createOrUpdateDnaStructures(tx, version.dnaStructures, entityId);
};
