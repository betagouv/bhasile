// Ouvre la campagne d'actualisation de l'année : crée la FormDefinition
// `actualisation-<année>` (+ ses 4 FormStepDefinition, + deadline), puis matérialise,
// pour chaque structure éligible (finalisée et non fermée), un Form (status=false) et
// ses FormSteps. L'actualisation n'est plus une entité : c'est un formulaire de structure.
// Année = argument CLI (sinon ACTUALISATION_YEAR), deadline = 2e argument (YYYY-MM-DD).
// Idempotent : une structure ayant déjà le form de l'année est sautée.
// Usage : yarn script create-actualisation-campaigns <année> <deadline YYYY-MM-DD>

import "dotenv/config";

import { pathToFileURL } from "node:url";

import {
  ACTUALISATION_FORM_STEP_SLUGS,
  getActualisationFormSlug,
} from "@/app/api/forms/form.constants";
import { resolveCurrentVersion } from "@/app/api/structure-versions/structure-version.util";
import {
  isBornFromCreation,
  isFinalisationFormValidated,
} from "@/app/api/structures/structure.util";
import { StructureVersionTransformationType } from "@/generated/prisma/enums";
import { createPrismaClient } from "@/prisma-client";
import { StepStatus } from "@/types/form.type";

const prisma = createPrismaClient();

const parseDeadline = (value: string | undefined): Date | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const deadline = new Date(value);
  return Number.isNaN(deadline.getTime()) ? null : deadline;
};

const run = async () => {
  try {
    const actualisationYear = Number(
      process.argv[2] ?? process.env.ACTUALISATION_YEAR
    );

    if (!Number.isInteger(actualisationYear)) {
      console.log(
        "⏭️ Aucune année d'actualisation valide (arg ou ACTUALISATION_YEAR) — rien à créer."
      );
      return;
    }

    const deadline = parseDeadline(process.argv[3]);
    if (!deadline) {
      console.log(
        "⏭️ Deadline manquante ou invalide (2e argument attendu au format YYYY-MM-DD) — rien à créer."
      );
      return;
    }

    const slug = getActualisationFormSlug(actualisationYear);

    const formDefinition = await prisma.formDefinition.upsert({
      where: { slug },
      update: { deadline },
      create: {
        slug,
        name: `Actualisation ${actualisationYear}`,
        version: 1,
        deadline,
      },
    });

    const stepDefinitions = [];
    for (const stepSlug of ACTUALISATION_FORM_STEP_SLUGS) {
      const stepDefinition = await prisma.formStepDefinition.upsert({
        where: {
          formDefinitionId_slug: {
            formDefinitionId: formDefinition.id,
            slug: stepSlug,
          },
        },
        update: {},
        create: {
          formDefinitionId: formDefinition.id,
          label: stepSlug,
          slug: stepSlug,
        },
      });
      stepDefinitions.push(stepDefinition);
    }

    const now = new Date();

    const structures = await prisma.structure.findMany({
      include: {
        forms: { include: { formDefinition: { select: { slug: true } } } },
        structureVersions: {
          include: {
            structureVersionTransformation: {
              include: {
                transformation: {
                  include: { form: { select: { status: true } } },
                },
              },
            },
          },
        },
      },
    });

    let createdCount = 0;
    let skippedExisting = 0;
    for (const structure of structures) {
      const hasForm = structure.forms.some(
        (form) => form.formDefinition.slug === slug
      );
      if (hasForm) {
        skippedExisting++;
        continue;
      }

      const isFinalised =
        isBornFromCreation(structure.structureVersions, now) ||
        isFinalisationFormValidated(structure.forms);
      if (!isFinalised) {
        continue;
      }

      const currentVersion = resolveCurrentVersion(
        structure.structureVersions,
        now
      );
      const isClosed =
        currentVersion?.structureVersionTransformation?.type ===
        StructureVersionTransformationType.FERMETURE;
      if (isClosed) {
        continue;
      }

      await prisma.form.create({
        data: {
          structureId: structure.id,
          formDefinitionId: formDefinition.id,
          status: false,
          formSteps: {
            create: stepDefinitions.map((stepDefinition) => ({
              stepDefinitionId: stepDefinition.id,
              status: StepStatus.NON_COMMENCE,
            })),
          },
        },
      });
      createdCount++;
    }

    console.log(
      `✅ ${slug} : ${createdCount} form(s) créé(s), ${skippedExisting} déjà présent(s)`
    );
  } catch (error) {
    console.error("❌ Erreur création des formulaires d'actualisation:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run();
}
