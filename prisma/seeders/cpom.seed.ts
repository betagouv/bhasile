import { fakerFR as faker } from "@faker-js/faker";

import {
  type Departement,
  FileUploadCategory,
  FileUploadGranularity,
  type PrismaClient,
} from "@/generated/prisma/client";

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

  const departements = await prisma.departement.findMany();

  const departementToRegion = new Map<string, string>(
    departements.map((departement: Departement) => [
      departement.numero,
      departement.region,
    ])
  );

  const structuresByOperateurAndRegion = new Map<string, number[]>();
  const structureIdToDnaCode = new Map<number, string>();

  for (const operateur of operateurs) {
    for (const structure of operateur.structures) {
      const region = departementToRegion.get(
        structure.departementAdministratif ?? ""
      );

      if (!region) {
        continue;
      }
      structureIdToDnaCode.set(structure.id, structure.dnaCode);
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
    const [operateurIdStr, region] = key.split("_");

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

    const cpomName = `CPOM ${operateurIdStr} ${region} ${yearStart}-${yearEnd}`;

    // Select between 60% and 100% of structures for this CPOM
    const nbStructures = Math.max(
      minStructuresPerCpom,
      Math.floor(structures.length * faker.number.float({ min: 0.6, max: 1.0 }))
    );
    const selectedStructures = faker.helpers.arrayElements(
      structures,
      nbStructures
    );

    // TODO: Temp feature. Remove when all cpom are initialized via the CPOM form
    const isUiInitialized = faker.datatype.boolean({ probability: 0.5 });

    // Create the CPOM with one acte administratif carrying the date range
    const cpom = await prisma.cpom.create({
      data: {
        name: cpomName,
        operateurId: Number(operateurIdStr),
        granularity: "REGIONALE",
        region: isUiInitialized ? region : undefined,
        departements: isUiInitialized
          ? departements
              .filter((departement) => departement.region === region)
              .map((departement) => departement.numero)
          : undefined,
        dateStart: !isUiInitialized ? dateStart : undefined,
        dateEnd: !isUiInitialized ? dateEnd : undefined,
        ...(isUiInitialized
          ? {
              actesAdministratifs: {
                create: {
                  key: `cpom-acte-${operateurIdStr}-${region}-${yearStart}-${yearEnd}`,
                  mimeType: "application/pdf",
                  fileSize: faker.number.int({ min: 1000, max: 500000 }),
                  originalName: `convention-cpom-${yearStart}-${yearEnd}.pdf`,
                  category: FileUploadCategory.CPOM,
                  startDate: dateStart,
                  endDate: dateEnd,
                  granularity: FileUploadGranularity.CPOM,
                },
              },
            }
          : {}),
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
      },
    });

    for (const cpomStructure of cpomStructures) {
      const structureDnaCode = structureIdToDnaCode.get(
        cpomStructure.structureId
      );

      if (!structureDnaCode) {
        console.warn(
          `⚠️ Impossible de trouver le dnaCode pour la structure ${cpomStructure.structureId}, millésimes ignorés`
        );
        continue;
      }

      const millesimeYears = buildStructureMillesimeYears(
        cpomStructure.dateStart?.getFullYear() ?? yearStart,
        cpomStructure.dateEnd?.getFullYear() ?? yearEnd
      );

      for (const millesimeYear of millesimeYears) {
        await prisma.structureMillesime.upsert({
          where: {
            structureDnaCode_year: {
              structureDnaCode,
              year: millesimeYear,
            },
          },
          update: {
            cpom: true,
          },
          create: {
            structureDnaCode,
            year: millesimeYear,
            cpom: true,
          },
        });
      }
    }

    // Create CPOM millesimes for each year of the CPOM
    const millesimeYears = [...Array(dureeAnnees)].map(
      (_, index) => yearStart + index
    );

    for (const millesimeYear of millesimeYears) {
      await prisma.cpomMillesime.create({
        data: {
          cpomId: cpom.id,
          year: millesimeYear,
          dotationDemandee: faker.number.float({
            min: 0,
            max: 1000000,
            fractionDigits: 2,
          }),
          dotationAccordee: faker.number.float({
            min: 0,
            max: 1000000,
            fractionDigits: 2,
          }),
          cumulResultatNet: faker.number.float({
            min: -100000,
            max: 500000,
            fractionDigits: 2,
          }),
          repriseEtat: faker.number.float({
            min: 0,
            max: 50000,
            fractionDigits: 2,
          }),
          affectationReservesFondsDedies: faker.number.float({
            min: 0,
            max: 300000,
            fractionDigits: 2,
          }),
          reserveInvestissement: faker.number.float({
            min: 0,
            max: 200000,
            fractionDigits: 2,
          }),
          chargesNonReconductibles: faker.number.float({
            min: 0,
            max: 100000,
            fractionDigits: 2,
          }),
          reserveCompensationDeficits: faker.number.float({
            min: 0,
            max: 150000,
            fractionDigits: 2,
          }),
          reserveCompensationBFR: faker.number.float({
            min: 0,
            max: 100000,
            fractionDigits: 2,
          }),
          reserveCompensationAmortissements: faker.number.float({
            min: 0,
            max: 200000,
            fractionDigits: 2,
          }),
          fondsDedies: faker.number.float({
            min: 0,
            max: 300000,
            fractionDigits: 2,
          }),
          reportANouveau: faker.number.float({
            min: 0,
            max: 50000,
            fractionDigits: 2,
          }),
          autre: faker.number.float({
            min: 0,
            max: 100000,
            fractionDigits: 2,
          }),
          commentaire: faker.datatype.boolean({ probability: 0.3 })
            ? faker.lorem.sentence()
            : null,
        },
      });
    }
  }

  console.log("✅ CPOMs créés avec succès");
};
