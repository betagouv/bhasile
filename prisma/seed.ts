import "dotenv/config";

import { fakerFR as faker } from "@faker-js/faker";

import { StructureType } from "@/types/structure.type";

import { createPrismaClient } from "./client";
import { createAntenneList } from "./seeders/antenne.seed";
import {
  generateAllBhasileCodes,
  getNextBhasileCode,
} from "./seeders/bhasile-codes.seed";
import { createFakeCpoms } from "./seeders/cpom.seed";
import { createDepartements } from "./seeders/departements-seed";
import { createDnaList } from "./seeders/dna.seed";
import { createFinessList } from "./seeders/finess.seed";
import {
  createFakeFormDefinition,
  createFakeFormStepDefinition,
} from "./seeders/form.seed";
import { createFakeOperateur } from "./seeders/operateur.seed";
import { seedParentChildFileUploads } from "./seeders/parent-child-file-upload.seed";
import { getRegionFromDepartement } from "./seeders/region.seed";
import {
  createFakeStructure,
  createFakeStuctureWithRelations,
} from "./seeders/structure.seed";
import { convertToPrismaObject } from "./utils/convertToObject";
import { wipeTables } from "./utils/wipe";

const prisma = createPrismaClient();

export async function seed(): Promise<void> {
  console.log("🗑️ Suppression des données existantes...");
  await wipeTables(prisma);

  // Créer d'abord les FormDefinitions et FormStepDefinitions
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

  const departementsToInsert = createDepartements();
  await prisma.departement.createMany({
    data: departementsToInsert,
  });

  console.log(`🌍 Départements créés : ${departementsToInsert.length}`);

  console.log("🔢 Génération des codes Bhasile par région...");
  const bhasileCodesMap = generateAllBhasileCodes(500); // Not all codes will be used
  console.log("✅ Codes Bhasile générés");

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
      { length: faker.number.int({ min: 50, max: 100 }) },
      () => {
        const departementAdministratif = String(
          faker.number.int({ min: 1, max: 95 })
        ).padStart(2, "0");
        const region = getRegionFromDepartement(departementAdministratif);
        const codeBhasile = region
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
          cpom: faker.datatype.boolean(),
          isFinalised: faker.datatype.boolean(),
          counter: counter++,
        });
        return fakeStructure;
      }
    );

    const structuresOfiiToInsert = Array.from(
      { length: faker.number.int({ min: 500, max: 600 }) },
      () => {
        const departementAdministratif = String(
          faker.number.int({ min: 1, max: 95 })
        ).padStart(2, "0");
        const region = getRegionFromDepartement(departementAdministratif);
        const codeBhasile = region
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
          cpom: faker.datatype.boolean(),
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

  const structures = await prisma.structure.findMany({
    take: faker.number.int({ min: 30, max: 50 }),
  });
  console.log(
    `📎 Ajout des fichiers parent-enfant pour ${structures.length} structures`
  );

  for (const structure of structures) {
    await seedParentChildFileUploads(prisma, structure.dnaCode);
  }
  console.log("✅ Fichiers parent-enfant ajoutés");

  await createFakeCpoms(prisma);

  // Récupérer toutes les structures créées avec leurs codes Bhasile
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
    `✅ ${allStructures.length} structures récupérées (${structuresWithBhasile.length} avec codeBhasile)`
  );

  // Créer les codes FINESS et les lier aux structures (1 à 3 par structure)
  console.log("🏥 Création et liaison des codes FINESS...");
  const finessList = createFinessList(allStructures);
  await prisma.finess.createMany({ data: finessList });

  console.log(`✅ ${finessList.length} codes FINESS créés et structures liées`);

  // Créer les codes DNA
  console.log("🧬 Création des codes DNA...");
  const dnaList = createDnaList(150);
  await prisma.dna.createMany({ data: dnaList });

  const createdDnas = await prisma.dna.findMany({ select: { id: true } });

  console.log(`✅ ${dnaList.length} codes DNA créés`);

  console.log("🔗 Création des liens DNA-Structure...");
  const dnaStructures: Array<{
    dnaId: number;
    structureId: number;
    startDate: Date | null;
    endDate: Date | null;
  }> = [];

  for (const structure of allStructures) {
    const numberOfDnas = faker.number.int({ min: 1, max: 3 });
    const selectedDnas = faker.helpers.arrayElements(createdDnas, numberOfDnas);

    for (const dna of selectedDnas) {
      dnaStructures.push({
        dnaId: dna.id,
        structureId: structure.id,
        startDate:
          faker.helpers.maybe(() => faker.date.past({ years: 2 }), {
            probability: 0.1,
          }) ?? null,
        endDate:
          faker.helpers.maybe(() => faker.date.past({ years: 2 }), {
            probability: 0.1,
          }) ?? null,
      });
    }
  }

  await prisma.dnaStructure.createMany({ data: dnaStructures });
  console.log(`✅ ${dnaStructures.length} liens DNA-Structure créés`);

  // Créer les antennes (1 à 3 par structure avec codeBhasile)
  console.log("📡 Création des antennes...");
  const antennes = createAntenneList(allStructures);

  await prisma.antenne.createMany({ data: antennes });
  console.log(`✅ ${antennes.length} antennes créées`);
}

seed();
