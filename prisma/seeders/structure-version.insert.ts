import { Prisma, PrismaClient } from "@/generated/prisma/client";

import { insertMany, insertManyReturningIds } from "../utils/bulk";
import {
  ActePlan,
  ControlePlan,
  DocumentFinancierPlan,
  EvaluationPlan,
  FormPlan,
  SeededStructure,
  StructurePlan,
  WithFileUploads,
} from "./structure-version.seed";

type FileUploadLink = Pick<
  Prisma.FileUploadCreateManyInput,
  "acteAdministratifId" | "documentFinancierId" | "controleId" | "evaluationId"
>;

type FormLink = Pick<
  Prisma.FormCreateManyInput,
  "structureId" | "transformationId" | "structureVersionTransformationId"
>;

const insertWithFileUploads = async <TRow>(
  prisma: PrismaClient,
  insert: (data: TRow[]) => Prisma.PrismaPromise<{ id: number }[]>,
  entries: WithFileUploads<TRow>[],
  link: (parentId: number) => FileUploadLink
): Promise<void> => {
  const parentIds = await insertManyReturningIds(
    insert,
    entries.map((entry) => entry.row)
  );

  await insertMany(
    (data) => prisma.fileUpload.createMany({ data }),
    entries.flatMap((entry, index) =>
      entry.fileUploads.map((fileUpload) => ({
        ...fileUpload,
        ...link(parentIds[index]),
      }))
    )
  );
};

/**
 * Écrit un lot de structures table par table, dans l'ordre des clés étrangères.
 *
 * Chaque passe est un unique INSERT multi-lignes pour tout le lot. Les tables
 * dont les enfants ont besoin de l'identifiant utilisent `createManyAndReturn` :
 * Postgres renvoie les lignes dans l'ordre des VALUES, donc `xxxIds[i]`
 * correspond à l'entrée `i` du tableau envoyé. C'est ce qui permet de câbler
 * les relations sans jamais relire la base.
 */
export const insertStructures = async (
  prisma: PrismaClient,
  plans: StructurePlan[]
): Promise<SeededStructure[]> => {
  const structureIds = await insertManyReturningIds(
    (data) =>
      prisma.structure.createManyAndReturn({ data, select: { id: true } }),
    plans.map((plan) => plan.structure)
  );

  // Le lot est aplati une fois pour toutes : chaque entrée garde le lien vers
  // son plan d'origine pour retrouver les identifiants au fil des passes.
  const owners = plans.flatMap((plan, planIndex) =>
    plan.relations === null
      ? []
      : [{ structureId: structureIds[planIndex], relations: plan.relations }]
  );
  const versions = plans.flatMap((plan, planIndex) =>
    plan.versions.map((versionPlan) => ({
      planIndex,
      structureId: structureIds[planIndex],
      versionPlan,
    }))
  );
  const transformed = versions.flatMap((version) =>
    version.versionPlan.transformation === null
      ? []
      : [{ version, transformation: version.versionPlan.transformation }]
  );

  const transformationIds = await insertManyReturningIds(
    (data) =>
      prisma.transformation.createManyAndReturn({ data, select: { id: true } }),
    transformed.map(({ transformation }) => ({ type: transformation.type }))
  );

  const svtIds = await insertManyReturningIds(
    (data) =>
      prisma.structureVersionTransformation.createManyAndReturn({
        data,
        select: { id: true },
      }),
    transformed.map(({ transformation }, index) => ({
      ...transformation.structureVersionTransformation,
      transformationId: transformationIds[index],
    }))
  );

  const svtIdByVersion = new Map(
    transformed.map(({ version }, index) => [version, svtIds[index]])
  );
  const versionIds = await insertManyReturningIds(
    (data) =>
      prisma.structureVersion.createManyAndReturn({
        data,
        select: { id: true },
      }),
    versions.map((version) => ({
      ...version.versionPlan.version,
      structureId: version.structureId,
      structureVersionTransformationId: svtIdByVersion.get(version) ?? null,
    }))
  );

  await insertMany(
    (data) => prisma.contact.createMany({ data }),
    versions.flatMap((version, index) =>
      version.versionPlan.contacts.map((contact) => ({
        ...contact,
        structureVersionId: versionIds[index],
      }))
    )
  );
  await insertMany(
    (data) => prisma.adresse.createMany({ data }),
    versions.flatMap((version, index) =>
      version.versionPlan.adresses.map((adresse) => ({
        ...adresse,
        structureVersionId: versionIds[index],
      }))
    )
  );

  await insertMany(
    (data) => prisma.structureTypologie.createMany({ data }),
    owners.flatMap(({ structureId, relations }) =>
      relations.typologies.map((typologie) => ({ ...typologie, structureId }))
    )
  );
  await insertMany(
    (data) => prisma.budget.createMany({ data }),
    owners.flatMap(({ structureId, relations }) =>
      relations.budgets.map((budget) => ({ ...budget, structureId }))
    )
  );
  await insertMany(
    (data) => prisma.indicateurFinancier.createMany({ data }),
    owners.flatMap(({ structureId, relations }) =>
      relations.indicateursFinanciers.map((indicateur) => ({
        ...indicateur,
        structureId,
      }))
    )
  );

  // Actes de structure et actes de transformation vont dans la même table :
  // une seule passe, quel que soit le parent.
  const actes: ActePlan[] = [
    ...owners.flatMap(({ structureId, relations }) =>
      relations.actes.map((acte) => ({
        ...acte,
        row: { ...acte.row, structureId },
      }))
    ),
    ...transformed.flatMap(({ transformation }, index) =>
      transformation.actes.map((acte) => ({
        ...acte,
        row: { ...acte.row, structureVersionTransformationId: svtIds[index] },
      }))
    ),
  ];
  await insertWithFileUploads(
    prisma,
    (data) =>
      prisma.acteAdministratif.createManyAndReturn({
        data,
        select: { id: true },
      }),
    actes,
    (acteAdministratifId) => ({ acteAdministratifId })
  );

  const documentsFinanciers: DocumentFinancierPlan[] = owners.flatMap(
    ({ structureId, relations }) =>
      relations.documentsFinanciers.map((documentFinancier) => ({
        ...documentFinancier,
        row: { ...documentFinancier.row, structureId },
      }))
  );
  await insertWithFileUploads(
    prisma,
    (data) =>
      prisma.documentFinancier.createManyAndReturn({
        data,
        select: { id: true },
      }),
    documentsFinanciers,
    (documentFinancierId) => ({ documentFinancierId })
  );

  const controles: ControlePlan[] = owners.flatMap(
    ({ structureId, relations }) =>
      relations.controles.map((controle) => ({
        ...controle,
        row: { ...controle.row, structureId },
      }))
  );
  await insertWithFileUploads(
    prisma,
    (data) =>
      prisma.controle.createManyAndReturn({ data, select: { id: true } }),
    controles,
    (controleId) => ({ controleId })
  );

  const evaluations: EvaluationPlan[] = owners.flatMap(
    ({ structureId, relations }) =>
      relations.evaluations.map((evaluation) => ({
        ...evaluation,
        row: { ...evaluation.row, structureId },
      }))
  );
  await insertWithFileUploads(
    prisma,
    (data) =>
      prisma.evaluation.createManyAndReturn({ data, select: { id: true } }),
    evaluations,
    (evaluationId) => ({ evaluationId })
  );

  // Formulaire de finalisation, formulaire de transformation et formulaire de
  // bloc partagent la table Form : une passe, puis une passe pour leurs étapes.
  const forms: (FormPlan & { link: FormLink })[] = [
    ...owners.flatMap(({ structureId, relations }) =>
      relations.forms.map((form) => ({ ...form, link: { structureId } }))
    ),
    ...transformed.map(({ transformation }, index) => ({
      ...transformation.form,
      link: { transformationId: transformationIds[index] },
    })),
    ...transformed.map(({ transformation }, index) => ({
      ...transformation.structureVersionTransformationForm,
      link: { structureVersionTransformationId: svtIds[index] },
    })),
  ];
  const formIds = await insertManyReturningIds(
    (data) => prisma.form.createManyAndReturn({ data, select: { id: true } }),
    forms.map(({ form, link }) => ({ ...form, ...link }))
  );
  await insertMany(
    (data) => prisma.formStep.createMany({ data }),
    forms.flatMap(({ formSteps }, index) =>
      formSteps.map((formStep) => ({ ...formStep, formId: formIds[index] }))
    )
  );

  const versionIdsByPlan: number[][] = plans.map(() => []);
  versions.forEach((version, index) => {
    versionIdsByPlan[version.planIndex].push(versionIds[index]);
  });

  return plans.map((plan, index) => ({
    structureId: structureIds[index],
    currentVersionId: versionIdsByPlan[index][plan.currentVersionIndex],
  }));
};
