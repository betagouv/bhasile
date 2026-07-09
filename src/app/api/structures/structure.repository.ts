import { Structure, StructureType } from "@/generated/prisma/client";
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
import {
  currentVersionArgs,
  currentVersionWhere,
} from "../structure-versions/structure-version.db.type";
import { createOrUpdateStructureVersion } from "../structure-versions/structure-version.repository";
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
  id: number,
  now: Date
): Promise<{ departementAdministratif: string | null }> => {
  const structure = await prisma.structure.findUniqueOrThrow({
    where: { id },
    select: {
      structureVersions: {
        ...currentVersionArgs(now),
        select: { departementAdministratif: true },
      },
    },
  });
  return {
    departementAdministratif:
      structure.structureVersions[0]?.departementAdministratif ?? null,
  };
};

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
      ...currentVersionWhere(new Date()),
    },
    orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
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
  isOperateurUpdate: boolean = false
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
      await createOrUpdateActesAdministratifs(tx, actesAdministratifs, {
        structureId: structure.id,
      });
      await createOrUpdateDocumentsFinanciers(tx, documentsFinanciers, {
        structureId: structure.id,
      });
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

// Only used in e2e tests
export const createMinimalStructure = async (
  dnaCodes: { code: string }[],
  structure: {
    codeBhasile: string;
    type: StructureType;
    operateurId: number;
    departementAdministratif?: string;
    nom: string;
    adresseAdministrative: string;
    codePostalAdministratif: string;
    communeAdministrative: string;
  }
): Promise<Structure> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }

  const upsertedStructure = await prisma.structure.upsert({
    where: { codeBhasile: structure.codeBhasile },
    update: {
      ...structure,
      dnaStructures: {
        create: dnaCodes.map(({ code }) => ({
          dna: {
            connectOrCreate: {
              where: { code },
              create: { code },
            },
          },
        })),
      },
    },
    create: {
      ...structure,
      dnaStructures: {
        create: dnaCodes.map(({ code }) => ({
          dna: {
            connectOrCreate: {
              where: { code },
              create: { code },
            },
          },
        })),
      },
    },
  });

  return upsertedStructure;
};

// Only used in e2e tests
export const createMinimalStructureVersion = async (
  structureId: number,
  version: {
    departementAdministratif?: string;
    communeAdministrative?: string;
    codePostalAdministratif?: string;
    adresseAdministrative?: string;
    nom?: string;
    effectiveDate?: Date;
  }
): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }

  await prisma.structureVersion.deleteMany({
    where: { structureId, structureVersionTransformationId: null },
  });

  const createdVersion = await prisma.structureVersion.create({
    data: {
      structureId,
      effectiveDate: version.effectiveDate ?? new Date("2020-01-01"),
      departementAdministratif: version.departementAdministratif,
      communeAdministrative: version.communeAdministrative,
      codePostalAdministratif: version.codePostalAdministratif,
      adresseAdministrative: version.adresseAdministrative,
      nom: version.nom,
    },
  });

  await prisma.dnaStructure.updateMany({
    where: { structureId, structureVersionId: null },
    data: { structureVersionId: createdVersion.id },
  });
};

// Only used in e2e tests
export const deleteStructure = async (codeBhasile: string): Promise<void> => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only used in e2e tests");
  }
  await prisma.structure.delete({ where: { codeBhasile } });
};
