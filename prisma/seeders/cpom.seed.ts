import { fakerFR as faker } from "@faker-js/faker";

import {
  ActeAdministratifCategory,
  type PrismaClient,
} from "@/generated/prisma/client";
import { StructureType } from "@/types/structure.type";

import { createFakeBudget } from "./budget.seed";
import { createFakeFileUpload } from "./file-upload.seed";

const buildStructureMillesimeYears = (start: number, end: number): number[] => {
  const years: number[] = [];

  for (let year = start; year <= end; year++) {
    years.push(year);
  }

  return years;
};

export const createFakeCpoms = async (
  prisma: PrismaClient,
  maxCpoms: number = 10,
  minStructuresPerCpom: number = 2
): Promise<void> => {
  const currentYear = new Date().getFullYear();

  console.log(`📋 Création de ${maxCpoms} CPOM maximum...`);

  // Constitute potential CPOMs from operators, regions and structures
  const operateurs = await prisma.operateur.findMany({
    include: {
      structures: {
        include: {
          operateur: true,
        },
      },
    },
  });

  const departements = await prisma.departement.findMany({
    include: {
      regionAdministrative: {
        select: { name: true },
      },
    },
  });
  const regions = await prisma.region.findMany();

  const regionNameToId = new Map<string, number>(
    regions.map((region) => [region.name, region.id])
  );

  const departementToRegion = new Map<string, string>(
    departements.flatMap((departement) =>
      departement.regionAdministrative?.name
        ? [[departement.numero, departement.regionAdministrative.name] as const]
        : []
    )
  );

  const structuresByOperateurAndRegion = new Map<string, number[]>();

  for (const operateur of operateurs) {
    for (const structure of operateur.structures) {
      const region = departementToRegion.get(
        structure.departementAdministratif ?? ""
      );

      if (!region) {
        continue;
      }
      const key = `${operateur.id}_${region}`;
      const existingStructures = structuresByOperateurAndRegion.get(key) || [];
      structuresByOperateurAndRegion.set(key, [
        ...existingStructures,
        structure.id,
      ]);
    }
  }

  // Filter groups with at least n structures and randomize selection
  const validGroups = faker.helpers
    .shuffle(
      Array.from(structuresByOperateurAndRegion.entries()).filter(
        ([, structures]) => structures.length >= minStructuresPerCpom
      )
    )
    .slice(0, maxCpoms);

  if (validGroups.length === 0) {
    console.log(
      `⚠️ Aucun groupe (opérateur + région) avec au moins ${minStructuresPerCpom} structures trouvé`
    );
    return;
  }

  // Create CPOMs for valid groups
  for (const [key, structures] of validGroups) {
    const [operateurIdStr, regionName] = key.split("_");

    const dureeAnnees = faker.number.int({ min: 3, max: 5 });
    const timeShift = faker.number.int({ min: -2, max: 2 });
    const yearStart = currentYear - dureeAnnees + timeShift;
    const yearEnd = yearStart + dureeAnnees;
    const dateStart = faker.date.between({
      from: new Date(yearStart, 0, 1),
      to: new Date(yearStart, 11, 31),
    });
    const dateEnd = faker.date.between({
      from: new Date(yearEnd, 0, 1),
      to: new Date(yearEnd, 11, 31),
    });

    const cpomName = `CPOM ${operateurIdStr} ${regionName} ${yearStart}-${yearEnd}`;

    // Select between 60% and 100% of structures for this CPOM
    const nbStructures = Math.max(
      minStructuresPerCpom,
      Math.floor(structures.length * faker.number.float({ min: 0.6, max: 1.0 }))
    );
    const selectedStructures = faker.helpers.arrayElements(
      structures,
      nbStructures
    );

    const isUiInitialized = faker.datatype.boolean({ probability: 0.5 });

    const regionId = regionNameToId.get(regionName);

    const structuresOfCpom = await prisma.structure.findMany({
      where: {
        id: { in: selectedStructures },
      },
    });
    const structureTypes = [
      ...new Set(
        structuresOfCpom.map((structure) => structure.type as StructureType)
      ),
    ].filter((type) => type !== null);

    // Create budgets for each year of the CPOM and each structure type
    const budgetYears = [...Array(dureeAnnees)].map(
      (_, index) => yearStart + index
    );

    const cpom = await prisma.cpom.create({
      data: {
        name: cpomName,
        operateur: { connect: { id: Number(operateurIdStr) } },
        granularity: "REGIONALE",
        region:
          isUiInitialized && regionId
            ? { connect: { id: regionId } }
            : undefined,
        departements: isUiInitialized
          ? {
              create: departements
                .filter(
                  (departement) =>
                    departement.regionAdministrative?.name === regionName
                )
                .map((departement) => ({
                  departementId: departement.id,
                })),
            }
          : undefined,
        ...(isUiInitialized
          ? {
              actesAdministratifs: {
                create: {
                  category: ActeAdministratifCategory.CONVENTION,
                  startDate: dateStart,
                  endDate: dateEnd,
                  fileUploads: {
                    create: createFakeFileUpload(),
                  },
                },
              },
            }
          : undefined),
        budgets: {
          create: budgetYears.flatMap((budgetYear) => {
            return structureTypes.map((structureType) => {
              return createFakeBudget({
                year: budgetYear,
                type: structureType,
              });
            });
          }),
        },
        structures: {
          create: selectedStructures.map((structureId) => {
            // 10% chance that a structure joins or leaves the CPOM in the middle
            const joinLater = faker.datatype.boolean({ probability: 0.1 });
            const leaveEarly = faker.datatype.boolean({ probability: 0.1 });

            let yearJoin: number | null = null;
            let yearLeave: number | null = null;
            let dateJoin: Date | null = null;
            let dateLeave: Date | null = null;

            if (joinLater) {
              const joinMin = Math.min(yearStart + 1, currentYear);
              const joinMax = Math.min(
                yearStart + dureeAnnees - 1,
                currentYear
              );
              if (joinMin <= joinMax) {
                yearJoin = faker.number.int({
                  min: joinMin,
                  max: joinMax,
                });
                dateJoin = faker.date.between({
                  from: new Date(yearJoin, 0, 1),
                  to: new Date(yearJoin, 11, 31),
                });
              }
            }

            if (leaveEarly && !joinLater) {
              const leaveMax = Math.min(
                yearStart + dureeAnnees - 1,
                currentYear - 1
              );
              const leaveMin = Math.min(
                Math.max(yearStart + 1, yearStart),
                leaveMax
              );
              if (leaveMin <= leaveMax) {
                yearLeave = faker.number.int({
                  min: leaveMin,
                  max: leaveMax,
                });
                dateLeave = faker.date.between({
                  from: new Date(yearLeave, 0, 1),
                  to: new Date(yearLeave, 11, 31),
                });
              }
            }

            return {
              structureId: structureId,
              dateStart: dateJoin,
              dateEnd: dateLeave,
            };
          }),
        },
      },
    });

    console.log(
      `🍏 CPOM créé : ${cpomName} avec ${selectedStructures.length} structures`
    );

    const cpomStructures = await prisma.cpomStructure.findMany({
      where: { cpomId: cpom.id },
      select: {
        structureId: true,
        dateStart: true,
        dateEnd: true,
        structure: {
          select: {
            type: true,
          },
        },
      },
    });

    for (const cpomStructure of cpomStructures) {
      const millesimeYears = buildStructureMillesimeYears(
        cpomStructure.dateStart?.getFullYear() ?? yearStart,
        cpomStructure.dateEnd?.getFullYear() ?? yearEnd
      );

      for (const millesimeYear of millesimeYears) {
        await prisma.structureMillesime.upsert({
          where: {
            structureId_year: {
              structureId: cpomStructure.structureId,
              year: millesimeYear,
            },
          },
          update: {
            cpom: true,
          },
          create: {
            structureId: cpomStructure.structureId,
            year: millesimeYear,
            cpom: true,
          },
        });
      }
    }
  }

  console.log("✅ CPOMs créés avec succès");
};
