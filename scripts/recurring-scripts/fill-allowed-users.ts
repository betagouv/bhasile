// Remplir la table AllowedUsers avec les patterns d'email autorisés pour l'authentification
// Usage: yarn script fill-allowed-users fill-allowed-users.ts

import "dotenv/config";

import { loadCsvFromS3 } from "scripts/utils/csv-loader";

import { AllowedUserGranularity, Departement } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

type AllowedUserCsvRow = {
  emailPattern: string;
  granularity: string;
  department: string;
};

const prisma = createPrismaClient();

const fetchAllowedUsers = async (): Promise<AllowedUserCsvRow[]> => {
  const allowedUsers = await loadCsvFromS3<AllowedUserCsvRow>(
    process.env.DOCS_BUCKET_NAME!,
    "allowed-users.csv"
  );
  return allowedUsers;
};

const getTargetDepartementIds = (
  row: AllowedUserCsvRow,
  allDepartements: Departement[]
): number[] => {
  if (row.granularity === AllowedUserGranularity.NATIONAL) {
    return allDepartements.map((departement) => departement.id);
  }
  if (row.granularity === AllowedUserGranularity.REGION) {
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
  if (row.granularity === AllowedUserGranularity.DEPARTEMENT) {
    const departement = allDepartements.find(
      (departement) => departement.numero === row.department
    );
    return departement ? [departement.id] : [];
  }
  return [];
};

const upsertAllowedUsers = async (
  row: AllowedUserCsvRow,
  departementIds: number[]
) => {
  const data = {
    emailPattern: row.emailPattern,
    granularity: row.granularity as AllowedUserGranularity,
  };

  await prisma.allowedUser.upsert({
    where: { emailPattern: row.emailPattern },
    update: {
      ...data,
      departementAllowedUsers: {
        deleteMany: {},
        create: departementIds.map((id) => ({ departementId: id })),
      },
    },
    create: {
      ...data,
      departementAllowedUsers: {
        create: departementIds.map((id) => ({ departementId: id })),
      },
    },
  });
};

const [csvRows, allDepartements] = await Promise.all([
  fetchAllowedUsers(),
  prisma.departement.findMany(),
]);

for (const row of csvRows) {
  const targetIds = getTargetDepartementIds(row, allDepartements);
  await upsertAllowedUsers(row, targetIds);
  console.log(`Mis à jour : ${row.emailPattern} (${row.granularity})`);
}
