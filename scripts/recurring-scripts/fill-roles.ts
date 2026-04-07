// Remplir la table Roles avec les patterns d'email autorisés pour l'authentification et les groupes de permissions
// Usage: yarn script fill-roles roles.csv

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
  region: string;
  emailPattern: string;
};

const prisma = createPrismaClient();

const args = process.argv.slice(2);
const csvFilename = args[0] ?? "roles.csv";

const fetchRoles = async (): Promise<RoleCsvRow[]> => {
  return loadCsvFromS3<RoleCsvRow>(process.env.DOCS_BUCKET_NAME!, csvFilename);
};

const getTargetDepartementIds = (
  row: RoleCsvRow,
  allDepartements: DepartementWithRegion[]
): number[] => {
  if (row.name === "NATIONAL") {
    return allDepartements.map((departement) => departement.id);
  }
  if (row.name.startsWith("REGION")) {
    return allDepartements
      .filter((departement) => {
        return departement.regionAdministrative?.code === row.region;
      })
      .map((departement) => {
        return departement.id;
      });
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
  const pattern = row.emailPattern?.trim();

  // Role et departements.
  const role = await prisma.role.upsert({
    where: { name: row.name },
    update: {
      roleDepartements: {
        createMany: {
          data: departementIds.map((departementId) => ({ departementId })),
          skipDuplicates: true,
        },
      },
    },
    create: {
      name: row.name,
      roleDepartements: {
        createMany: {
          data: departementIds.map((departementId) => ({ departementId })),
          skipDuplicates: true,
        },
      },
    },
    select: { id: true },
  });

  if (!pattern) return;

  // Si emailPattern, on connecte le pattern au rôle.
  await prisma.emailPattern.upsert({
    where: { pattern },
    update: {
      role: { connect: { id: role.id } },
    },
    create: {
      pattern,
      role: {
        connect: { id: role.id },
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
    }
    console.log("✅ Rôles créés");
  } catch (error) {
    console.error("❌ Erreur lors de la création des roles :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

run();
