// Remplir la table Roles avec les patterns d'email autorisés pour l'authentification et les groupes de permissions
// Usage: yarn script fill-roles

import "dotenv/config";

import { loadCsvFromS3 } from "scripts/utils/csv-loader";

import { Prisma } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

type DepartementWithRegion = Prisma.DepartementGetPayload<{
  include: { regionAdministrative: true };
}>;

type RoleCsvRow = {
  name: string;
  departement: string;
  emailPattern: string;
};

const prisma = createPrismaClient();

const fetchRoles = async (): Promise<RoleCsvRow[]> => {
  return loadCsvFromS3<RoleCsvRow>(process.env.DOCS_BUCKET_NAME!, "roles.csv");
};

const getTargetDepartementIds = (
  row: RoleCsvRow,
  allDepartements: DepartementWithRegion[]
): number[] => {
  if (row.name === "NATIONAL") {
    return allDepartements.map((departement) => departement.id);
  }
  if (row.name.startsWith("REGION")) {
    const region = `FR_${row.name.split("_")[1]}`;
    return allDepartements
      .filter(
        (departement) => departement.regionAdministrative?.code === region
      )
      .map((departement) => departement.id);
  }
  if (row.name.startsWith("DEPARTEMENT")) {
    const departement = allDepartements.find(
      (departement) => departement.numero === row.departement
    );
    return departement ? [departement.id] : [];
  }
  return [];
};

const createRoles = async (row: RoleCsvRow, departementIds: number[]) => {
  await prisma.emailPattern.upsert({
    where: { pattern: row.emailPattern },
    update: {
      role: {
        connectOrCreate: {
          where: { name: row.name },
          create: {
            name: row.name,
            roleDepartements: {
              create: departementIds.map((id) => ({ departementId: id })),
            },
          },
        },
      },
    },
    create: {
      pattern: row.emailPattern,
      role: {
        connectOrCreate: {
          where: { name: row.name },
          create: {
            name: row.name,
            roleDepartements: {
              create: departementIds.map((id) => ({ departementId: id })),
            },
          },
        },
      },
    },
  });
};

const createAnonymousRole = async () => {
  await prisma.role.upsert({
    where: { name: "ANONYMOUS" },
    update: {},
    create: {
      name: "ANONYMOUS",
      roleDepartements: {
        create: [],
      },
    },
  });
};

const run = async () => {
  try {
    console.log("🧑 Création des rôles");
    const [csvRows, allDepartements] = await Promise.all([
      fetchRoles(),
      prisma.departement.findMany({ include: { regionAdministrative: true } }),
    ]);

    await createAnonymousRole();
    for (const row of csvRows) {
      const targetIds = getTargetDepartementIds(row, allDepartements);
      await createRoles(row, targetIds);
      console.log(`Ajout de ${row.emailPattern} (${row.name})`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création des roles :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

run();
