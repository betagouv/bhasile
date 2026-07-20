import { getActualisationFormSlug } from "@/app/api/forms/form.constants";
import {
  structureAutoriseesDocuments,
  structureSubventionneesDocuments,
} from "@/app/components/forms/finance/documents/documentsStructures";
import { getYearRange } from "@/app/utils/date.util";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { DocumentFinancierCategory } from "@/types/document-financier.type";
import { StepStatus } from "@/types/form.type";
import { StructureType } from "@/types/structure.type";

import { prisma } from "./prisma";
import {
  createStructureForTest,
  SeededStructure,
  seedValidIndicateursFinanciers,
  seedValidStructureBudgets,
  seedValidStructureTypologies,
} from "./structure.seed";
import { seedFinalisationForm } from "./transformation-source.seed";

// Plus d'entité Campaign : une structure actualisable = une structure avec son
// formulaire `actualisation-<année>`.
export type SeededActualisationStructure = SeededStructure;

const isAutorisee = (type: StructureType): boolean =>
  type === StructureType.CADA || type === StructureType.CPH;

const fakeFileUpload = (key: string) => ({
  key,
  mimeType: "application/pdf",
  fileSize: 1024,
  originalName: "document.pdf",
});

// Sur-seed : un document (à clé factice) par catégorie requise et par année.
// Couvre quelle que soit l'année de référence exigée par la validation.
const seedRequiredDocuments = async (
  structureId: number,
  codeBhasile: string,
  type: StructureType
): Promise<void> => {
  const documents = isAutorisee(type)
    ? structureAutoriseesDocuments
    : structureSubventionneesDocuments;
  const requiredCategories = documents
    .filter((document) => document.required)
    .map((document) => document.value as DocumentFinancierCategory);

  for (const category of requiredCategories) {
    for (const year of getYearRange().years) {
      await prisma.documentFinancier.create({
        data: {
          structureId,
          category,
          year,
          fileUploads: {
            create: [fakeFileUpload(`${codeBhasile}-doc-${category}-${year}`)],
          },
        },
      });
    }
  }
};

const seedRequiredActe = async (
  structureId: number,
  codeBhasile: string,
  type: StructureType
): Promise<void> => {
  const category: ActeAdministratifCategory = isAutorisee(type)
    ? "ARRETE_TARIFICATION"
    : "CONVENTION";

  await prisma.acteAdministratif.create({
    data: {
      structureId,
      category,
      startDate: new Date("2022-01-01T12:00:00.000Z"),
      endDate: new Date("2027-01-01T12:00:00.000Z"),
      fileUploads: {
        create: [fakeFileUpload(`${codeBhasile}-acte-${category}`)],
      },
    },
  });
};

/**
 * Seed une structure finalisée avec une campagne d'actualisation ouverte, prête
 * à être parcourue et validée par un agent. Coquille de campagne construite en
 * Prisma direct (le README e2e interdit d'importer le code serveur/DB de prod ;
 * réplique `createActualisationCampaignShell`).
 */
export const createActualisationStructureForTest = async ({
  type = StructureType.CADA,
}: { type?: StructureType } = {}): Promise<SeededActualisationStructure> => {
  const year = Number(process.env.ACTUALISATION_YEAR);
  if (!Number.isInteger(year)) {
    throw new Error(
      "ACTUALISATION_YEAR doit être une année valide pour le seed d'actualisation."
    );
  }

  const base = await createStructureForTest({ type });

  await seedValidStructureBudgets(base.id);
  await seedValidIndicateursFinanciers(base.id);
  await seedRequiredDocuments(base.id, base.codeBhasile, type);
  await seedRequiredActe(base.id, base.codeBhasile, type);
  await seedFinalisationForm(base.id);

  // L'actualisation est un formulaire de structure (plus d'entité Campaign) :
  // FormDefinition `actualisation-<année>` + un Form status=false par structure.
  const formDefinition = await prisma.formDefinition.findUniqueOrThrow({
    where: { slug: getActualisationFormSlug(year) },
    include: { stepsDefinition: true },
  });

  await seedValidStructureTypologies(base.id);

  await prisma.form.create({
    data: {
      structureId: base.id,
      formDefinitionId: formDefinition.id,
      status: false,
      formSteps: {
        create: formDefinition.stepsDefinition.map((stepDefinition) => ({
          stepDefinitionId: stepDefinition.id,
          status: StepStatus.NON_COMMENCE,
        })),
      },
    },
  });

  return { ...base };
};

export const deleteActualisationForm = async (
  structureId: number,
  year: number
): Promise<void> => {
  await prisma.form
    .deleteMany({
      where: {
        structureId,
        formDefinition: { slug: getActualisationFormSlug(year) },
      },
    })
    .catch(() => {});
};
