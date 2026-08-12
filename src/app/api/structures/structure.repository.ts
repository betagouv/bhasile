import { getNow } from "@/app/utils/now.util";
import { Structure } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { StructureAgentUpdateApiType } from "@/schemas/api/structure.schema";
import { StructureVersionApiType } from "@/schemas/api/structure-version.schema";
import { PrismaTransaction } from "@/types/prisma.type";

import { createOrUpdateActesAdministratifs } from "../actes-administratifs/acte-administratif.repository";
import { createOrUpdateBudgets } from "../budgets/budget.repository";
import { createOrUpdateControles } from "../controles/controle.repository";
import { createOrUpdateDocumentsFinanciers } from "../documents-financiers/documentFinancier.repository";
import { createOrUpdateEvaluations } from "../evaluations/evaluation.repository";
import {
  createOrUpdateForms,
  initializeStructureDefaultForms,
} from "../forms/form.repository";
import { createOrUpdateIndicateursFinanciers } from "../indicateurs-financiers/indicateur-financier.repository";
import { createOrUpdateStructureMillesimes } from "../structure-millesimes/structure-millesime.repository";
import { createOrUpdateStructureTypologies } from "../structure-typologies/structure-typologie.repository";
import { currentVersionWhere } from "../structure-versions/structure-version.db.type";
import {
  createOrUpdateStructureVersion,
  mirrorLegacyPlacesToBaseVersions,
} from "../structure-versions/structure-version.repository";
import { VERSIONED_FIELD_KEYS } from "./structure.constants";
import {
  StructureDbList,
  StructureDbOperateur,
  structureDetailsInclude,
  structureListInclude,
  StructureListLight,
  structureListLightSelect,
  structureListVersionInclude,
} from "./structure.db.type";

export const findAllStructures = (): Promise<StructureListLight[]> =>
  prisma.structure.findMany({ select: structureListLightSelect });

export const findStructuresByIds = (
  structureIds: number[],
  versionIds: number[]
): Promise<StructureDbList[]> =>
  prisma.structure.findMany({
    where: { id: { in: structureIds } },
    include: {
      ...structureListInclude,
      structureVersions: {
        where: { id: { in: versionIds } },
        include: structureListVersionInclude,
      },
    },
  });

export const findOneOperateur = async (
  id: number
): Promise<StructureDbOperateur> => {
  const structure = await prisma.structure.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      codeBhasile: true,
      forms: true,
      type: true,
    },
  });
  return {
    id: structure.id,
    codeBhasile: structure.codeBhasile,
    forms: structure.forms,
    type: structure.type ?? null,
  };
};

export const findStructureDepartement = async (
  id: number
): Promise<{ departementAdministratif: string | null }> =>
  prisma.structure.findUniqueOrThrow({
    where: { id },
    select: { departementAdministratif: true },
  });

export const findValidatedActualisationForm = (
  structureId: number,
  slug: string
): Promise<{ id: number } | null> =>
  prisma.form.findFirst({
    where: { structureId, status: true, formDefinition: { slug } },
    select: { id: true },
  });

export const findOne = async (id: number) => {
  const structure = await prisma.structure.findFirstOrThrow({
    where: {
      id,
    },
    include: structureDetailsInclude,
  });
  return structure;
};

const hasVersionedFields = (structure: StructureAgentUpdateApiType): boolean =>
  VERSIONED_FIELD_KEYS.some((key) => structure[key] !== undefined);

const writeToCurrentVersion = async (
  tx: PrismaTransaction,
  structure: StructureAgentUpdateApiType
): Promise<void> => {
  if (!hasVersionedFields(structure)) {
    return;
  }

  const currentVersion = await tx.structureVersion.findFirst({
    where: {
      structureId: structure.id,
      ...currentVersionWhere(getNow()),
    },
    orderBy: [{ effectiveDate: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    select: { id: true, effectiveDate: true },
  });

  if (!currentVersion) {
    throw new Error(
      `Aucune version courante à modifier pour la structure ${structure.id}`
    );
  }

  const versionedData = Object.fromEntries(
    VERSIONED_FIELD_KEYS.map((key) => [key, structure[key]])
  ) as Pick<StructureAgentUpdateApiType, (typeof VERSIONED_FIELD_KEYS)[number]>;

  const versionPayload: StructureVersionApiType = {
    id: currentVersion.id,
    structureId: structure.id,
    effectiveDate: currentVersion.effectiveDate?.toISOString(),
    ...versionedData,
  };

  await createOrUpdateStructureVersion(tx, versionPayload, {
    structureId: structure.id,
  });
};

export const updateOne = async (
  structure: StructureAgentUpdateApiType,
  isOperateurUpdate: boolean = false,
  options: { skipActesOrphanDelete?: boolean } = {}
): Promise<Structure> => {
  const {
    budgets,
    indicateursFinanciers,
    actesAdministratifs,
    documentsFinanciers,
    controles,
    evaluations,
    forms,
    structureMillesimes,
    structureTypologies,
  } = structure;

  return await prisma.$transaction(
    async (tx) => {
      const updatedStructure = await updateStructure(
        tx,
        structure,
        isOperateurUpdate
      );

      await initializeStructureDefaultForms(
        tx,
        isOperateurUpdate,
        structure.id
      );

      await writeToCurrentVersion(tx, structure);
      await createOrUpdateBudgets(tx, budgets, { structureId: structure.id });
      await createOrUpdateIndicateursFinanciers(tx, indicateursFinanciers, {
        structureId: structure.id,
      });
      await createOrUpdateActesAdministratifs(
        tx,
        actesAdministratifs,
        { structureId: structure.id },
        { skipOrphanDelete: options.skipActesOrphanDelete }
      );
      await createOrUpdateDocumentsFinanciers(tx, documentsFinanciers, {
        structureId: structure.id,
      });
      await createOrUpdateStructureTypologies(tx, structureTypologies, {
        structureId: structure.id,
      });
      if (structureTypologies?.length) {
        await mirrorLegacyPlacesToBaseVersions(tx, {
          structureId: structure.id,
        });
      }
      await createOrUpdateControles(tx, controles, structure.id);
      await createOrUpdateForms(tx, forms, { structureId: structure.id });
      await createOrUpdateEvaluations(tx, evaluations, structure.id);
      await createOrUpdateStructureMillesimes(tx, structureMillesimes, {
        structureId: structure.id,
      });

      return updatedStructure;
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );
};

const updateStructure = async (
  tx: PrismaTransaction,
  structure: StructureAgentUpdateApiType,
  isOperateurUpdate: boolean
): Promise<Structure> => {
  const { operateur, filiale, creationDate, date303 } = structure;

  const updatedStructure = await tx.structure.update({
    where: {
      id: structure.id,
    },
    data: {
      filiale,
      creationDate: creationDate ?? undefined,
      date303,
      type: isOperateurUpdate ? structure.type : undefined,
      operateur: {
        connect: operateur
          ? {
              id: operateur?.id,
            }
          : undefined,
      },
    },
  });
  return updatedStructure;
};
