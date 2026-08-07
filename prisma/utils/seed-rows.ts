import { Prisma, PrismaClient } from "@/generated/prisma/client";

import { createManyChunked } from "./bulk";

// L'ordre est celui des dépendances de clés étrangères : il pilote aussi bien la
// déclaration du tampon que la séquence d'insertion.
export const SEED_TABLES = [
  "Structure",
  "Transformation",
  "StructureVersionTransformation",
  "StructureVersion",
  "Form",
  "FormStep",
  "ActeAdministratif",
  "DocumentFinancier",
  "Controle",
  "Evaluation",
  "FileUpload",
  "Budget",
  "IndicateurFinancier",
  "StructureTypologie",
  "Contact",
  "Adresse",
] as const;

export type SeedTable = (typeof SEED_TABLES)[number];

export type SeedRows = {
  Structure: Prisma.StructureCreateManyInput[];
  Transformation: Prisma.TransformationCreateManyInput[];
  StructureVersionTransformation: Prisma.StructureVersionTransformationCreateManyInput[];
  StructureVersion: Prisma.StructureVersionCreateManyInput[];
  Form: Prisma.FormCreateManyInput[];
  FormStep: Prisma.FormStepCreateManyInput[];
  ActeAdministratif: Prisma.ActeAdministratifCreateManyInput[];
  DocumentFinancier: Prisma.DocumentFinancierCreateManyInput[];
  Controle: Prisma.ControleCreateManyInput[];
  Evaluation: Prisma.EvaluationCreateManyInput[];
  FileUpload: Prisma.FileUploadCreateManyInput[];
  Budget: Prisma.BudgetCreateManyInput[];
  IndicateurFinancier: Prisma.IndicateurFinancierCreateManyInput[];
  StructureTypologie: Prisma.StructureTypologieCreateManyInput[];
  Contact: Prisma.ContactCreateManyInput[];
  Adresse: Prisma.AdresseCreateManyInput[];
};

export const createSeedRows = (): SeedRows => ({
  Structure: [],
  Transformation: [],
  StructureVersionTransformation: [],
  StructureVersion: [],
  Form: [],
  FormStep: [],
  ActeAdministratif: [],
  DocumentFinancier: [],
  Controle: [],
  Evaluation: [],
  FileUpload: [],
  Budget: [],
  IndicateurFinancier: [],
  StructureTypologie: [],
  Contact: [],
  Adresse: [],
});

export const countSeedRows = (rows: SeedRows): number =>
  SEED_TABLES.reduce((total, table) => total + rows[table].length, 0);

export const flushSeedRows = async (
  prisma: PrismaClient,
  rows: SeedRows
): Promise<number> => {
  let inserted = 0;

  inserted += await createManyChunked(
    (data) => prisma.structure.createMany({ data }),
    rows.Structure
  );
  inserted += await createManyChunked(
    (data) => prisma.transformation.createMany({ data }),
    rows.Transformation
  );
  inserted += await createManyChunked(
    (data) => prisma.structureVersionTransformation.createMany({ data }),
    rows.StructureVersionTransformation
  );
  inserted += await createManyChunked(
    (data) => prisma.structureVersion.createMany({ data }),
    rows.StructureVersion
  );
  inserted += await createManyChunked(
    (data) => prisma.form.createMany({ data }),
    rows.Form
  );
  inserted += await createManyChunked(
    (data) => prisma.formStep.createMany({ data }),
    rows.FormStep
  );
  inserted += await createManyChunked(
    (data) => prisma.acteAdministratif.createMany({ data }),
    rows.ActeAdministratif
  );
  inserted += await createManyChunked(
    (data) => prisma.documentFinancier.createMany({ data }),
    rows.DocumentFinancier
  );
  inserted += await createManyChunked(
    (data) => prisma.controle.createMany({ data }),
    rows.Controle
  );
  inserted += await createManyChunked(
    (data) => prisma.evaluation.createMany({ data }),
    rows.Evaluation
  );
  inserted += await createManyChunked(
    (data) => prisma.fileUpload.createMany({ data }),
    rows.FileUpload
  );
  inserted += await createManyChunked(
    (data) => prisma.budget.createMany({ data }),
    rows.Budget
  );
  inserted += await createManyChunked(
    (data) => prisma.indicateurFinancier.createMany({ data }),
    rows.IndicateurFinancier
  );
  inserted += await createManyChunked(
    (data) => prisma.structureTypologie.createMany({ data }),
    rows.StructureTypologie
  );
  inserted += await createManyChunked(
    (data) => prisma.contact.createMany({ data }),
    rows.Contact
  );
  inserted += await createManyChunked(
    (data) => prisma.adresse.createMany({ data }),
    rows.Adresse
  );

  for (const table of SEED_TABLES) {
    rows[table].length = 0;
  }

  return inserted;
};
