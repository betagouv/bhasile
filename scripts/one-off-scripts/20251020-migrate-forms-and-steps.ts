// @ts-nocheck
import { PrismaClient, StepStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function migrateFormsAndSteps() {
  console.log("🚀 Début de la migration des Forms...");

  // Créer FormDefinition
  const formDefinition = await prisma.formDefinition.upsert({
    where: {
      slug: "finalisation-v1",
    },
    update: {
      name: "finalisation",
      version: 1,
    },
    create: {
      slug: "finalisation-v1",
      name: "finalisation",
      version: 1,
    },
  });

  console.log("✅ FormDefinition créée");

  // Créer les FormStepDefinitions
  const steps = [
    { label: "01-identification", slug: "01-identification" },
    { label: "02-documents-financiers", slug: "02-documents-financiers" },
    { label: "03-finance", slug: "03-finance" },
    { label: "04-controles", slug: "04-controles" },
    { label: "05-documents", slug: "05-documents" },
    { label: "06-notes", slug: "06-notes" },
  ];

  const stepDefinitions = [];
  for (const step of steps) {
    const stepDefinition = await prisma.formStepDefinition.upsert({
      where: {
        formDefinitionId_slug: {
          formDefinitionId: formDefinition.id,
          slug: step.slug,
        },
      },
      update: {
        slug: step.slug,
      },
      create: {
        label: step.label,
        formDefinitionId: formDefinition.id,
        slug: step.slug,
      },
    });

    stepDefinitions.push(stepDefinition);
  }
  console.log("✅ FormStepDefinitions créées");

  // Récupérer toutes les Structures et créer les Forms et Formsteps
  const structures = await prisma.structure.findMany();
  console.log(`📊 ${structures.length} structures trouvées`);

  let createdForms = 0;
  let createdSteps = 0;

  for (const structure of structures) {
    const form = await prisma.form.upsert({
      where: {
        structureCodeDna_formDefinitionId: {
          structureCodeDna: structure.dnaCode,
          formDefinitionId: formDefinition.id,
        },
      },
      update: {},
      create: {
        structureCodeDna: structure.dnaCode,
        formDefinitionId: formDefinition.id,
        status: structure.state === "FINALISE",
      },
    });
    createdForms++;

    for (const stepDefinition of stepDefinitions) {
      let status: StepStatus = StepStatus.NON_COMMENCE;

      if (structure.state === "FINALISE") {
        status = StepStatus.VALIDE;
      } else if (
        stepDefinition.label === "01-identification" ||
        stepDefinition.label === "02-documents-financiers"
      ) {
        status = StepStatus.A_VERIFIER;
      }

      await prisma.formStep.upsert({
        where: {
          formId_stepDefinitionId: {
            formId: form.id,
            stepDefinitionId: stepDefinition.id,
          },
        },
        update: {
          status,
        },
        create: {
          formId: form.id,
          stepDefinitionId: stepDefinition.id,
          status,
        },
      });
      createdSteps++;
    }
  }

  console.log(`✅ Migration terminée :`);
  console.log(` - ${createdForms} Forms créés/mis à jour`);
  console.log(` - ${createdSteps} FormSteps créés/mis à jour`);
}

migrateFormsAndSteps()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
