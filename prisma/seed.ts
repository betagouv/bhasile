import "dotenv/config";

import { fakerFR as faker } from "@faker-js/faker";

import { recomputeAllAnomalies } from "@/app/api/anomalies/anomalie.service";
import {
  ACTUALISATION_FORM_STEP_SLUGS,
  getActualisationFormSlug,
} from "@/app/api/forms/form.constants";
import { mirrorLegacyPlacesToBaseVersions } from "@/app/api/structure-versions/structure-version.repository";
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
import { createNotificationsList } from "./seeders/notification.seed";
import {
  createFakeFiliale,
  createFakeOperateur,
} from "./seeders/operateur.seed";
import { createFakeRmus } from "./seeders/rmu.seed";
import {
  buildStructureRows,
  COLOCATED_COORDINATES,
  COLOCATED_STRUCTURES_COUNT,
  FormDefLookup,
  SeededStructure,
} from "./seeders/structure-version.seed";
import { upsertBhasileUser } from "./seeders/user.seed";
import { createIdAllocator, createManyChunked } from "./utils/bulk";
import {
  generateAllBhasileCodes,
  getNextBhasileCode,
} from "./utils/code-bhasile.util";
import { convertToPrismaObject } from "./utils/common.util";
import { getRegionFromDepartement } from "./utils/region.util";
import {
  countSeedRows,
  createSeedRows,
  flushSeedRows,
  SEED_TABLES,
} from "./utils/seed-rows";
import { syncSequences } from "./utils/sequences";
import { wipeTables } from "./utils/wipe";

const prisma = createPrismaClient();

// Graine fixe : les tests repository tournent en CI sur ce jeu de données.
// Surcharger via FAKER_SEED pour rejouer un échec observé avec une autre graine.
faker.seed(Number(process.env.FAKER_SEED) || 20260804);

// Les lignes générées sont vidées en base dès que le tampon dépasse ce seuil :
// le pic mémoire reste borné quel que soit le nombre de structures.
const FLUSH_ROW_THRESHOLD = 20_000;

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
    data: {
      name: "Actualisation 2026",
      slug: getActualisationFormSlug(2026),
      version: 1,
    },
  });
  await prisma.formStepDefinition.createMany({
    data: ACTUALISATION_FORM_STEP_SLUGS.map((slug) => ({
      formDefinitionId: actualisationFormDefinition.id,
      label: slug,
      slug,
    })),
  });

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

  console.log("🏢 Création des opérateurs et de leurs filiales...");
  const operateurs: {
    id: number;
    name: string;
    filiale: { id: number; name: string } | null;
  }[] = [];
  for (let index = 0; index < 5; index++) {
    const createdOperateur = await prisma.operateur.create({
      data: convertToPrismaObject(createFakeOperateur(index)),
      select: { id: true, name: true },
    });

    const hasFiliale = faker.datatype.boolean({ probability: 0.2 });
    const filiale = hasFiliale
      ? await prisma.operateur.create({
          data: convertToPrismaObject(
            createFakeFiliale(createdOperateur.id, createdOperateur.name, 0)
          ),
          select: { id: true, name: true },
        })
      : null;

    if (filiale) {
      console.log(`🏢 Filiale créée : ${filiale.name}`);
    }
    operateurs.push({ ...createdOperateur, filiale });
  }

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

  const nextId = await createIdAllocator(prisma, [
    ...SEED_TABLES,
    "Dna",
    "Finess",
  ] as const);
  const rows = createSeedRows();
  const context = { rows, nextId };

  const now = new Date();
  const seededStructures: SeededStructure[] = [];
  let colocatedLeft = COLOCATED_STRUCTURES_COUNT;

  for (const operateur of operateurs) {
    const nonOfiiCount = faker.number.int({
      min: seedNumber(200),
      max: seedNumber(250),
    });
    const ofiiCount = faker.number.int({
      min: seedNumber(50),
      max: seedNumber(100),
    });

    console.log(
      `🏠 Ajout de ${nonOfiiCount} structures et ${ofiiCount} structures OFII pour ${operateur.name}`
    );

    for (let index = 0; index < nonOfiiCount + ofiiCount; index++) {
      const ofii = index >= nonOfiiCount;
      const departementAdministratif = randomDepartement();
      const codeBhasile = nextCodeBhasile(departementAdministratif);

      const colocated = !ofii && colocatedLeft > 0;
      if (colocated) {
        colocatedLeft--;
      }

      const filiale =
        operateur.filiale && faker.datatype.boolean({ probability: 0.2 })
          ? operateur.filiale
          : null;

      seededStructures.push(
        buildStructureRows(context, {
          operateurId: filiale?.id ?? operateur.id,
          filiale: filiale?.name ?? null,
          codeBhasile,
          departementAdministratif,
          type: randomType(),
          ofii,
          isFinalised: faker.datatype.boolean(),
          now,
          formDefs,
          finalisationFormDefId: formFinalisationDefinition.id,
          finalisationStepDefinitions: stepDefinitions,
          coordinates: colocated ? COLOCATED_COORDINATES : undefined,
        })
      );

      if (countSeedRows(rows) >= FLUSH_ROW_THRESHOLD) {
        await flushSeedRows(prisma, rows);
      }
    }
  }

  await flushSeedRows(prisma, rows);
  await syncSequences(prisma);
  console.log(`✅ ${seededStructures.length} structures créées avec versions`);

  await mirrorLegacyPlacesToBaseVersions(prisma);

  await createFakeCpoms(prisma);

  console.log("🗒️ Seed des notes");
  const notesUser = await upsertBhasileUser(prisma);
  const notesToCreate = createNotesList({
    structures: seededStructures.map((seeded) => ({ id: seeded.structureId })),
    userId: notesUser.id,
  });
  await createManyChunked(
    (data) => prisma.note.createMany({ data }),
    notesToCreate
  );
  console.log(`✅ ${notesToCreate.length} notes créées`);

  console.log("📣 Seed des notifications");
  const notificationsToCreate = createNotificationsList();
  await prisma.notification.createMany({ data: notificationsToCreate });
  console.log(`✅ ${notificationsToCreate.length} notifications créées`);

  console.log("🏥 Création et liaison des codes FINESS...");
  const finessList = createFinessList(
    seededStructures.map((seeded) => ({
      structureVersionId: seeded.currentVersionId,
    }))
  ).map((finess) => ({ ...finess, id: nextId("Finess") }));

  await createManyChunked(
    (data) => prisma.finess.createMany({ data }),
    finessList.map((finess) => ({
      id: finess.id,
      code: finess.code,
      createdAt: finess.createdAt,
      updatedAt: finess.updatedAt,
    }))
  );
  await createManyChunked(
    (data) => prisma.structureFiness.createMany({ data }),
    finessList.map((finess) => ({
      finessId: finess.id,
      structureVersionId: finess.structureVersionId,
      description: finess.description,
    }))
  );
  console.log(
    `✅ ${finessList.length} codes FINESS créés et autant de liens StructureFiness`
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

  const [allOperateurs, allDepartements] = await Promise.all([
    prisma.operateur.findMany({ select: { id: true } }),
    prisma.departement.findMany({ select: { numero: true } }),
  ]);
  const dnas = createDnaList(totalDnasNeeded + numberOfUnusedDnas, {
    operateurIds: allOperateurs.map((operateur) => operateur.id),
    departementNumeros: allDepartements.map((departement) => departement.numero),
  }).map((dna) => ({ ...dna, id: nextId("Dna") }));
  await createManyChunked((data) => prisma.dna.createMany({ data }), dnas);
  console.log(`✅ ${dnas.length} codes DNA créés`);

  const dnaStructures = createDnaStructures({ dnas, perVersionCounts });
  await createManyChunked(
    (data) => prisma.dnaStructure.createMany({ data }),
    dnaStructures.map((dnaStructure) => ({
      dnaId: dnaStructure.dnaId,
      structureVersionId: dnaStructure.structureVersionId,
      description: dnaStructure.description,
    }))
  );
  console.log(`✅ ${dnaStructures.length} liens DnaStructure créés`);

  console.log("📊 Création des activités...");
  const activites = dnaStructures.flatMap(({ dnaCode }) =>
    createFakeActivites({ dnaCode })
  );
  await createManyChunked(
    (data) => prisma.activite.createMany({ data }),
    activites
  );
  console.log(`✅ ${activites.length} activités créées`);

  console.log("📊 Création des événements indésirables graves...");
  const dnaCodesByVersion = new Map<number, string[]>();
  for (const dnaStructure of dnaStructures) {
    const dnaCodes =
      dnaCodesByVersion.get(dnaStructure.structureVersionId) ?? [];
    dnaCodes.push(dnaStructure.dnaCode);
    dnaCodesByVersion.set(dnaStructure.structureVersionId, dnaCodes);
  }
  const evenementsIndesirablesGraves = createEvenementsIndesirablesGraves(
    seededStructures.map((seeded) => ({
      dnaCodes: dnaCodesByVersion.get(seeded.currentVersionId) ?? [],
    }))
  );
  await createManyChunked(
    (data) => prisma.evenementIndesirableGrave.createMany({ data }),
    evenementsIndesirablesGraves
  );

  console.log("📡 Création des antennes...");
  const antennes = createAntenneList(
    seededStructures.map((seeded) => ({
      structureVersionId: seeded.currentVersionId,
    }))
  );
  await createManyChunked(
    (data) => prisma.antenne.createMany({ data }),
    antennes
  );
  console.log(`✅ ${antennes.length} antennes créées`);

  await syncSequences(prisma);

  console.log("🔎 Recalcul des anomalies...");
  const structuresCount = await recomputeAllAnomalies();
  console.log(`✅ Anomalies recalculées pour ${structuresCount} structures`);
}

seed();
