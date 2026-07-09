import "dotenv/config";

import { fakerFR as faker } from "@faker-js/faker";

import {
  actualisationCampaignDefinitionSlug,
  INITIALISATION_CAMPAIGN_DEFINITION_SLUG,
  INITIALISATION_DEADLINE,
} from "@/app/api/campaigns/campaign.constants";
import {
  ACTUALISATION_FORM_SLUG,
  ACTUALISATION_FORM_STEP_SLUGS,
} from "@/app/api/forms/form.constants";
import { StructureType } from "@/types/structure.type";

import { createPrismaClient } from "./client";
import { createFakeActivites } from "./seeders/activite.seed";
import { createAntenneList } from "./seeders/antenne.seed";
import { createFakeCpoms } from "./seeders/cpom.seed";
import { seedRegionsAndDepartements } from "./seeders/departements.seed";
import { createDnaList, createDnaStructures } from "./seeders/dna.seed";
import { createEvenementsIndesirablesGraves } from "./seeders/evenement-indesirable-grave.seed";
import { createFinessList } from "./seeders/finess.seed";
import {
  createFakeFinalisationFormStepDefinition,
  createFakeFormFinalisation,
  createFakeFormStructureVersionTransformationContraction,
  createFakeFormStructureVersionTransformationCreation,
  createFakeFormStructureVersionTransformationExtension,
  createFakeFormStructureVersionTransformationFermeture,
  createFakeFormTransformation,
  createFakeStructureVersionTransformationCreationFormStepDefinition,
  createFakeStructureVersionTransformationFermetureFormStepDefinition,
} from "./seeders/form.seed";
import { createNotesList } from "./seeders/note.seed";
import {
  createFakeFiliale,
  createFakeOperateur,
} from "./seeders/operateur.seed";
import { createFakeRmus } from "./seeders/rmu.seed";
import {
  FormDefLookup,
  SeededStructure,
  seedStructureWithVersions,
} from "./seeders/structure-version.seed";
import { upsertBhasileUser } from "./seeders/user.seed";
import {
  generateAllBhasileCodes,
  getNextBhasileCode,
} from "./utils/code-bhasile.util";
import { convertToPrismaObject } from "./utils/common.util";
import { getRegionFromDepartement } from "./utils/region.util";
import { wipeTables } from "./utils/wipe";

const prisma = createPrismaClient();

const seedNumber = (number: number): number =>
  process.env.SMALL_SEED ? Math.floor(number / 10) : number;

async function seed(): Promise<void> {
  console.log("🗑️ Suppression des données existantes...");
  await wipeTables(prisma);

  console.log("📋 Création des FormDefinitions...");
  await prisma.formDefinition.create({
    data: createFakeFormTransformation(),
  });

  const formStructureVersionTransformationCreationDefinition =
    await prisma.formDefinition.create({
      data: createFakeFormStructureVersionTransformationCreation(),
    });
  await prisma.formStepDefinition.createMany({
    data: createFakeStructureVersionTransformationCreationFormStepDefinition(
      formStructureVersionTransformationCreationDefinition.id
    ),
  });
  const formStructureVersionTransformationExtensionDefinition =
    await prisma.formDefinition.create({
      data: createFakeFormStructureVersionTransformationExtension(),
    });
  await prisma.formStepDefinition.createMany({
    data: createFakeStructureVersionTransformationCreationFormStepDefinition(
      formStructureVersionTransformationExtensionDefinition.id
    ),
  });
  const formStructureVersionTransformationContractionDefinition =
    await prisma.formDefinition.create({
      data: createFakeFormStructureVersionTransformationContraction(),
    });
  await prisma.formStepDefinition.createMany({
    data: createFakeStructureVersionTransformationCreationFormStepDefinition(
      formStructureVersionTransformationContractionDefinition.id
    ),
  });
  const formStructureVersionTransformationFermetureDefinition =
    await prisma.formDefinition.create({
      data: createFakeFormStructureVersionTransformationFermeture(),
    });
  await prisma.formStepDefinition.createMany({
    data: createFakeStructureVersionTransformationFermetureFormStepDefinition(
      formStructureVersionTransformationFermetureDefinition.id
    ),
  });

  const formFinalisationDefinition = await prisma.formDefinition.create({
    data: createFakeFormFinalisation(),
  });

  const formFinalisationStepDefinitions =
    await prisma.formStepDefinition.createMany({
      data: createFakeFinalisationFormStepDefinition(
        formFinalisationDefinition.id
      ),
    });

  const stepDefinitions = await prisma.formStepDefinition.findMany({
    where: { formDefinitionId: formFinalisationDefinition.id },
    orderBy: { slug: "asc" },
    select: { id: true, slug: true },
  });

  console.log(
    `✅ ${formFinalisationStepDefinitions.count} FormStepDefinitions créées pour le formulaire finalisation`
  );

  const actualisationFormDefinition = await prisma.formDefinition.create({
    data: { name: "actualisation", slug: ACTUALISATION_FORM_SLUG, version: 1 },
  });
  await prisma.formStepDefinition.createMany({
    data: ACTUALISATION_FORM_STEP_SLUGS.map((slug) => ({
      formDefinitionId: actualisationFormDefinition.id,
      label: slug,
      slug,
    })),
  });

  const initialisationCampaignDefinition =
    await prisma.campaignDefinition.create({
      data: {
        name: "Initialisation",
        slug: INITIALISATION_CAMPAIGN_DEFINITION_SLUG,
        version: 1,
        deadline: INITIALISATION_DEADLINE,
      },
    });
  await prisma.campaignDefinition.create({
    data: {
      name: "Actualisation 2026",
      slug: actualisationCampaignDefinitionSlug(2026),
      version: 1,
      deadline: new Date(Date.UTC(2026, 11, 31)),
    },
  });
  console.log("✅ CampaignDefinitions créées (initialisation + actualisation)");

  const formDefinitions = await prisma.formDefinition.findMany({
    include: { stepsDefinition: { select: { id: true } } },
  });
  const formDefs: FormDefLookup = new Map(
    formDefinitions.map((definition) => [
      definition.slug,
      {
        id: definition.id,
        stepDefinitionIds: definition.stepsDefinition.map((step) => step.id),
      },
    ])
  );

  await seedRegionsAndDepartements(prisma);

  console.log("🚓 Création des données RMU...");
  await createFakeRmus(prisma);

  console.log("🔢 Génération des codes Bhasile par région...");
  const bhasileCodesMap = generateAllBhasileCodes(seedNumber(5000)); // Not all codes will be used
  console.log("✅ Codes Bhasile générés");

  const operateursToInsert = Array.from({ length: 5 }, (_, index) =>
    createFakeOperateur(index)
  );

  const randomDepartement = (): string =>
    String(faker.number.int({ min: 1, max: 95 })).padStart(2, "0");

  const randomType = (): StructureType =>
    faker.helpers.arrayElement([
      StructureType.CADA,
      StructureType.HUDA,
      StructureType.CAES,
      StructureType.CPH,
    ]);

  const nextCodeBhasile = (departementAdministratif: string): string => {
    const region = getRegionFromDepartement(departementAdministratif);
    const code = region ? getNextBhasileCode(bhasileCodesMap, region) : null;
    if (!code) {
      throw new Error(
        `Code Bhasile indisponible pour le département ${departementAdministratif}`
      );
    }
    return code;
  };

  const now = new Date();
  const seededStructures: SeededStructure[] = [];

  for (const operateurToInsert of operateursToInsert) {
    const createdOperateur = await prisma.operateur.create({
      data: convertToPrismaObject(operateurToInsert),
      select: { id: true, name: true },
    });

    const nonOfiiCount = faker.number.int({
      min: seedNumber(200),
      max: seedNumber(250),
    });
    const ofiiCount = faker.number.int({
      min: seedNumber(50),
      max: seedNumber(100),
    });

    console.log(
      `🏠 Ajout de ${nonOfiiCount} structures et ${ofiiCount} structures OFII pour ${createdOperateur.name}`
    );

    const operateurStructureIds: number[] = [];
    for (let index = 0; index < nonOfiiCount + ofiiCount; index++) {
      const ofii = index >= nonOfiiCount;
      const departementAdministratif = randomDepartement();
      const codeBhasile = nextCodeBhasile(departementAdministratif);

      const seeded = await seedStructureWithVersions(prisma, {
        operateurId: createdOperateur.id,
        codeBhasile,
        departementAdministratif,
        type: randomType(),
        ofii,
        isFinalised: faker.datatype.boolean(),
        now,
        formDefs,
        finalisationFormDefId: formFinalisationDefinition.id,
        finalisationStepDefinitions: stepDefinitions,
        initialisationCampaignDefinitionId: initialisationCampaignDefinition.id,
      });
      seededStructures.push(seeded);
      operateurStructureIds.push(seeded.structureId);
    }

    const hasFiliale = faker.datatype.boolean({ probability: 0.2 });
    if (!hasFiliale) {
      continue;
    }

    const filiale = await prisma.operateur.create({
      data: convertToPrismaObject(
        createFakeFiliale(createdOperateur.id, createdOperateur.name, 0)
      ),
      select: { id: true, name: true },
    });

    const structureIdsToMove = operateurStructureIds.filter(() =>
      faker.datatype.boolean({ probability: 0.2 })
    );

    if (structureIdsToMove.length > 0) {
      await prisma.structure.updateMany({
        where: { id: { in: structureIdsToMove } },
        data: { operateurId: filiale.id, filiale: filiale.name },
      });
      await prisma.structureVersionTransformation.updateMany({
        where: {
          structureVersion: { structureId: { in: structureIdsToMove } },
        },
        data: { operateurId: filiale.id },
      });
    }

    console.log(`🏢 Filiale créée : ${filiale.name}`);
  }

  console.log(`✅ ${seededStructures.length} structures créées avec versions`);

  await createFakeCpoms(prisma);

  console.log("🗒️ Seed des notes");
  const notesUser = await upsertBhasileUser(prisma);
  const notesToCreate = createNotesList({
    structures: seededStructures.map((seeded) => ({ id: seeded.structureId })),
    userId: notesUser.id,
  });
  await prisma.note.createMany({ data: notesToCreate });
  console.log(`✅ ${notesToCreate.length} notes créées`);

  console.log("🏥 Création et liaison des codes FINESS...");
  const finessList = createFinessList(
    seededStructures.map((seeded) => ({
      structureVersionId: seeded.currentVersionId,
    }))
  );
  await prisma.finess.createMany({
    data: finessList.map((finess) => ({
      code: finess.code,
      createdAt: finess.createdAt,
      updatedAt: finess.updatedAt,
    })),
  });
  const createdFinesses = await prisma.finess.findMany({
    where: { code: { in: finessList.map((finess) => finess.code) } },
    select: { id: true, code: true },
  });
  const finessIdByCode = new Map<string, number>();
  for (const finess of createdFinesses) {
    if (finess.code) {
      finessIdByCode.set(finess.code, finess.id);
    }
  }
  const structureFinessLinks = finessList.flatMap((finess) => {
    const finessId = finessIdByCode.get(finess.code);
    return finessId
      ? [
          {
            finessId,
            structureVersionId: finess.structureVersionId,
            description: finess.description,
          },
        ]
      : [];
  });
  await prisma.structureFiness.createMany({ data: structureFinessLinks });
  console.log(
    `✅ ${finessList.length} codes FINESS créés et ${structureFinessLinks.length} liens StructureFiness`
  );

  console.log("🧬 Création des codes DNA (1 à 3 par structure)...");

  const perVersionCounts = seededStructures.map((seeded) => ({
    structureVersionId: seeded.currentVersionId,
    count: faker.number.int({ min: 1, max: 3 }),
  }));
  const totalDnasNeeded = perVersionCounts.reduce(
    (acc, { count }) => acc + count,
    0
  );

  const numberOfUnusedDnas = 50;

  const dnaList = createDnaList(totalDnasNeeded + numberOfUnusedDnas);
  await prisma.dna.createMany({ data: dnaList });
  console.log(`✅ ${dnaList.length} codes DNA créés`);

  const createdDnas = await prisma.dna.findMany({
    where: { code: { in: dnaList.map((dna) => dna.code) } },
    select: { id: true, code: true },
  });
  const dnaByCode = new Map<string, number>();
  for (const dna of createdDnas) {
    dnaByCode.set(dna.code, dna.id);
  }

  const dnaStructures = createDnaStructures({
    dnaList,
    dnaByCode,
    perVersionCounts,
  });

  await prisma.dnaStructure.createMany({ data: dnaStructures });
  console.log(`✅ ${dnaStructures.length} liens DnaStructure créés`);

  console.log("📊 Création des activités...");
  const dnaStructuresWithDna = await prisma.dnaStructure.findMany({
    select: { dna: { select: { code: true } } },
  });
  const activites = dnaStructuresWithDna.flatMap((dnaStructure) => {
    const dnaCode = dnaStructure.dna?.code;
    if (!dnaCode) {
      return [];
    }
    return createFakeActivites({ dnaCode });
  });
  await prisma.activite.createMany({ data: activites });
  console.log(`✅ ${activites.length} activités créées`);

  console.log("📊 Création des événements indésirables graves...");
  const currentVersionsWithDna = await prisma.structureVersion.findMany({
    where: {
      id: { in: seededStructures.map((seeded) => seeded.currentVersionId) },
    },
    select: {
      id: true,
      dnaStructures: { select: { dna: { select: { code: true } } } },
    },
  });
  const evenementsIndesirablesGraves = createEvenementsIndesirablesGraves(
    currentVersionsWithDna
  );
  await prisma.evenementIndesirableGrave.createMany({
    data: evenementsIndesirablesGraves,
  });

  console.log("📡 Création des antennes...");
  const antennes = createAntenneList(
    seededStructures.map((seeded) => ({
      structureVersionId: seeded.currentVersionId,
    }))
  );
  await prisma.antenne.createMany({ data: antennes });
  console.log(`✅ ${antennes.length} antennes créées`);
}

seed();
