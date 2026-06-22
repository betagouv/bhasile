// One-off : crée les FormDefinition + FormStepDefinition de la feature transformation.
// Idempotent : upsert sur slug (FormDefinition) et [formDefinitionId, slug] (FormStepDefinition).
// Usage : yarn one-off 20260617-create-transformation-form-definitions

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const STRUCTURE_TRANSFORMATION_STEP_SLUGS = [
  "01-identification",
  "02-places-hebergement",
  "03-actes-administratifs",
];

const formDefinitions = [
  {
    slug: "transformation-v1",
    name: "transformation",
    stepSlugs: [],
  },
  {
    slug: "structure-transformation-creation-v1",
    name: "structure-transformation-creation",
    stepSlugs: STRUCTURE_TRANSFORMATION_STEP_SLUGS,
  },
  {
    slug: "structure-transformation-extension-v1",
    name: "structure-transformation-extension",
    stepSlugs: STRUCTURE_TRANSFORMATION_STEP_SLUGS,
  },
  {
    slug: "structure-transformation-contraction-v1",
    name: "structure-transformation-contraction",
    stepSlugs: STRUCTURE_TRANSFORMATION_STEP_SLUGS,
  },
  {
    slug: "structure-transformation-fermeture-v1",
    name: "structure-transformation-fermeture",
    stepSlugs: ["01-identification"],
  },
];

async function main() {
  console.log("🚀 Création des FormDefinition de la feature transformation...");

  for (const formDefinitionData of formDefinitions) {
    const formDefinition = await prisma.formDefinition.upsert({
      where: { slug: formDefinitionData.slug },
      update: {},
      create: {
        slug: formDefinitionData.slug,
        name: formDefinitionData.name,
        version: 1,
      },
    });

    for (const stepSlug of formDefinitionData.stepSlugs) {
      await prisma.formStepDefinition.upsert({
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
    }

    console.log(
      `✅ ${formDefinitionData.slug} — ${formDefinitionData.stepSlugs.length} step(s)`
    );
  }

  const transformationSlugs = formDefinitions.map(
    (formDefinitionData) => formDefinitionData.slug
  );

  const persistedDefinitions = await prisma.formDefinition.findMany({
    where: { slug: { in: transformationSlugs } },
    orderBy: { slug: "asc" },
    include: { _count: { select: { stepsDefinition: true } } },
  });

  const totalSteps = persistedDefinitions.reduce(
    (accumulator, definition) =>
      accumulator + definition._count.stepsDefinition,
    0
  );

  console.log(
    `\n✅ ${persistedDefinitions.length} FormDefinition transfo présentes, ${totalSteps} FormStepDefinition au total`
  );
  for (const definition of persistedDefinitions) {
    console.log(
      `   - ${definition.slug} : ${definition._count.stepsDefinition} step(s)`
    );
  }
}

main()
  .catch((error) => {
    console.error(
      "❌ Erreur création des FormDefinition transformation:",
      error
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
