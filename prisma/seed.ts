import "dotenv/config";

import { fakerFR as faker } from "@faker-js/faker";

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
  createFakeFormDefinition,
  createFakeFormStepDefinition,
} from "./seeders/form.seed";
import { createFakeOperateur } from "./seeders/operateur.seed";
import {
  createFakeStructure,
  createFakeStuctureWithRelations,
} from "./seeders/structure.seed";
import {
  generateAllBhasileCodes,
  getNextBhasileCode,
} from "./utils/code-bhasile.util";
import { convertToPrismaObject } from "./utils/common.util";
import { getRegionFromDepartement } from "./utils/region.util";
import { wipeTables } from "./utils/wipe";

const prisma = createPrismaClient();
const GENERATE_BHASILE_CODES = true; // Set to false to try migration one off script

export async function seed(): Promise<void> {
  console.log("🗑️ Suppression des données existantes...");
  await wipeTables(prisma);

  console.log("📋 Création des FormDefinitions...");
  const formDefinition = await prisma.formDefinition.create({
    data: createFakeFormDefinition(),
  });

  const formStepDefinitions = await prisma.formStepDefinition.createMany({
    data: createFakeFormStepDefinition(formDefinition.id),
  });

  const stepDefinitions = await prisma.formStepDefinition.findMany({
    where: { formDefinitionId: formDefinition.id },
    orderBy: { slug: "asc" },
    select: { id: true, slug: true },
  });

  console.log(`✅ ${formStepDefinitions.count} FormStepDefinitions créées`);

  await seedRegionsAndDepartements(prisma);

  let bhasileCodesMap: Map<string, string[]> | undefined;
  if (GENERATE_BHASILE_CODES) {
    console.log("🔢 Génération des codes Bhasile par région...");
    bhasileCodesMap = generateAllBhasileCodes(500); // Not all codes will be used
    console.log("✅ Codes Bhasile générés");
  }

  const operateursToInsert = Array.from({ length: 5 }, (_, index) =>
    createFakeOperateur(index)
  );

  let counter = 1;

  for (const operateurToInsert of operateursToInsert) {
    const baseParams = {
      formDefinitionId: formDefinition.id,
      stepDefinitions,
      operateurName: operateurToInsert.name,
    };
    const structuresToInsert = Array.from(
      { length: faker.number.int({ min: 20, max: 30 }) },
      () => {
        const departementAdministratif = String(
          faker.number.int({ min: 1, max: 95 })
        ).padStart(2, "0");
        const region = getRegionFromDepartement(departementAdministratif);
        const codeBhasile =
          GENERATE_BHASILE_CODES && region && bhasileCodesMap
            ? getNextBhasileCode(bhasileCodesMap, region)
            : null;

        const fakeStructure = createFakeStuctureWithRelations({
          codeBhasile,
          ...baseParams,
          departementAdministratif,
          ofii: false,
          type: faker.helpers.arrayElement([
            StructureType.CADA,
            StructureType.HUDA,
            StructureType.CAES,
            StructureType.CPH,
          ]),
          isFinalised: faker.datatype.boolean(),
          counter: counter++,
        });
        return fakeStructure;
      }
    );

    const structuresOfiiToInsert = Array.from(
      { length: faker.number.int({ min: 100, max: 200 }) },
      () => {
        const departementAdministratif = String(
          faker.number.int({ min: 1, max: 95 })
        ).padStart(2, "0");
        const region = getRegionFromDepartement(departementAdministratif);
        const codeBhasile =
          GENERATE_BHASILE_CODES && region && bhasileCodesMap
            ? getNextBhasileCode(bhasileCodesMap, region)
            : null;

        const fakeStructure = createFakeStructure({
          codeBhasile,
          ...baseParams,
          departementAdministratif,
          ofii: true,
          type: faker.helpers.arrayElement([
            StructureType.CADA,
            StructureType.HUDA,
            StructureType.CAES,
            StructureType.CPH,
          ]),
          isFinalised: faker.datatype.boolean(),
          counter: counter++,
        });
        return fakeStructure;
      }
    );

    const operateurWithStructures = {
      ...operateurToInsert,
      structures: [...structuresToInsert, ...structuresOfiiToInsert],
    };

    console.log(
      `🏠 Ajout de ${structuresToInsert.length} structures et ${structuresOfiiToInsert.length} structures OFII pour ${operateurToInsert.name}`
    );

    await prisma.operateur.create({
      data: convertToPrismaObject(operateurWithStructures),
    });
  }

  await createFakeCpoms(prisma);

  console.log("📊 Récupération des structures créées...");
  const allStructures = await prisma.structure.findMany({
    select: {
      id: true,
      codeBhasile: true,
      type: true,
    },
  });
  const structuresWithBhasile = allStructures.filter(
    (s) => s.codeBhasile !== null
  );
  console.log(
    `✅ ${allStructures.length} structures récupérées (${structuresWithBhasile.length} avec code Bhasile)`
  );

  console.log("🏥 Création et liaison des codes FINESS...");
  const finessList = createFinessList(allStructures);
  await prisma.finess.createMany({ data: finessList });
  console.log(`✅ ${finessList.length} codes FINESS créés et structures liées`);

  // Si on génère des codes Bhasile en seed, on génère aussi des DNA et on crée entre 1 et 3 liens DnaStructure par structure,
  if (GENERATE_BHASILE_CODES) {
    console.log("🧬 Création des codes DNA (1 à 3 par structure)...");

    const perStructureCounts = allStructures.map((s) => ({
      structureId: s.id,
      count: faker.number.int({ min: 1, max: 3 }),
    }));
    const totalDnasNeeded = perStructureCounts.reduce(
      (acc, { count }) => acc + count,
      0
    );

    const dnaList = createDnaList(totalDnasNeeded);
    await prisma.dna.createMany({ data: dnaList });
    console.log(`✅ ${dnaList.length} codes DNA créés`);

    const createdDnas = await prisma.dna.findMany({
      where: {
        code: {
          in: dnaList.map((d) => d.code),
        },
      },
      select: { id: true, code: true },
    });
    const dnaByCode = new Map<string, number>();
    for (const dna of createdDnas) {
      dnaByCode.set(dna.code, dna.id);
    }

    const dnaStructures = createDnaStructures({
      dnaList,
      dnaByCode,
      perStructureCounts,
    });

    await prisma.dnaStructure.createMany({ data: dnaStructures });
    console.log(`✅ ${dnaStructures.length} liens DnaStructure créés`);
  }

  console.log("📊 Création des activités...");
  const allStructuresWithDna = await prisma.structure.findMany({
    select: {
      id: true,
      dnaStructures: {
        select: {
          dna: true,
        },
      },
    },
  });
  const activites = allStructuresWithDna.flatMap((structure) => {
    return structure.dnaStructures.flatMap((dnaStructure) => {
      const dnaCode = dnaStructure?.dna?.code;
      if (!dnaCode) {
        return [];
      }
      return createFakeActivites({ dnaCode });
    });
  });
  await prisma.activite.createMany({ data: activites });
  console.log(`✅ ${activites.length} activités créées`);

  console.log("📊 Création des événements indésirables graves...");
  const evenementsIndesirablesGraves =
    createEvenementsIndesirablesGraves(allStructuresWithDna);
  await prisma.evenementIndesirableGrave.createMany({
    data: evenementsIndesirablesGraves,
  });

  console.log("📡 Création des antennes...");
  const antennes = createAntenneList(allStructures);
  await prisma.antenne.createMany({ data: antennes });
  console.log(`✅ ${antennes.length} antennes créées`);
}

seed();
