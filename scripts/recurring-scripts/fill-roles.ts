// Remplir la table Roles avec les patterns d'email autorisés pour l'authentification et les groupes de permissions
// Usage: yarn script fill-roles

import "dotenv/config";

import { loadCsvFromS3 } from "scripts/utils/csv-loader";

import { Departement, RoleGroup } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

type RoleCsvRow = {
  emailPattern: string;
  group: string;
  department: string;
};

const prisma = createPrismaClient();

const fetchRoles = async (): Promise<RoleCsvRow[]> => {
  return loadCsvFromS3<RoleCsvRow>(process.env.DOCS_BUCKET_NAME!, "roles.csv");
};

const getTargetDepartementIds = (
  row: RoleCsvRow,
  allDepartements: Departement[]
): number[] => {
  if (row.group === RoleGroup.NATIONAL) {
    return allDepartements.map((departement) => departement.id);
  }
  if (row.group === RoleGroup.REGION) {
    const referenceDepartement = allDepartements.find(
      (departement) => departement.numero === row.department
    );
    if (!referenceDepartement) {
      return [];
    }
    return allDepartements
      .filter(
        (departement) => departement.region === referenceDepartement.region
      )
      .map((departement) => departement.id);
  }
  if (row.group === RoleGroup.DEPARTEMENT) {
    const departement = allDepartements.find(
      (departement) => departement.numero === row.department
    );
    return departement ? [departement.id] : [];
  }
  return [];
};

const createRoles = async (row: RoleCsvRow, departementIds: number[]) => {
  const data = {
    emailPattern: row.emailPattern,
    granularity: row.group as RoleGroup,
  };

  await prisma.role.create({
    data: {
      ...data,
      roleDepartements: {
        create: departementIds.map((id) => ({ departementId: id })),
      },
    },
  });
};

const run = async () => {
  try {
    console.log("🧑 Création des roles");
    const [csvRows, allDepartements] = await Promise.all([
      fetchRoles(),
      prisma.departement.findMany(),
    ]);

    await prisma.role.deleteMany({});
    await prisma.role.deleteMany({});

    for (const row of csvRows) {
      const targetIds = getTargetDepartementIds(row, allDepartements);
      await createRoles(row, targetIds);
      console.log(`Ajout de ${row.emailPattern} (${row.group})`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création des roles :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

run();
