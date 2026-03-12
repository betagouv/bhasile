// Remplir la table Roles avec les patterns d'email autorisés pour l'authentification et les groupes de permissions
// Usage: yarn script fill-roles

import "dotenv/config";

import { loadCsvFromS3 } from "scripts/utils/csv-loader";

import { Departement, RoleGroup } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

type RoleCsvRow = {
  emailPattern: string;
  group: string;
  departement: string;
};

const prisma = createPrismaClient();

const getRegionNameFromGroup = (group: RoleGroup): string | undefined => {
  const regions = {
    REGION_ARA: "Auvergne-Rhône-Alpes",
    REGION_BFC: "Bourgogne-Franche-Comté",
    REGION_BRE: "Bretagne",
    REGION_CVL: "Centre-Val de Loire",
    REGION_GES: "Grand Est",
    REGION_HDF: "Hauts-de-France",
    REGION_IDF: "Île-de-France",
    REGION_NOR: "Normandie",
    REGION_NAQ: "Nouvelle-Aquitaine",
    REGION_OCC: "Occitanie",
    REGION_PDL: "Pays de la Loire",
    REGION_PAC: "Provence-Alpes-Côte d'Azur",
  } as Record<RoleGroup, string>;
  return regions[group];
};

const fetchRoles = async (): Promise<RoleCsvRow[]> => {
  return loadCsvFromS3<RoleCsvRow>(
    process.env.DOCS_BUCKET_NAME!,
    "roles_test.csv"
  );
};

const getTargetDepartementIds = (
  row: RoleCsvRow,
  allDepartements: Departement[]
): number[] => {
  if (row.group === RoleGroup.NATIONAL) {
    return allDepartements.map((departement) => departement.id);
  }
  if (row.group.startsWith("REGION")) {
    const region = getRegionNameFromGroup(row.group as RoleGroup);
    if (!region) {
      return [];
    }
    return allDepartements
      .filter((departement) => departement.region === region)
      .map((departement) => departement.id);
  }
  if (row.group === RoleGroup.DEPARTEMENT) {
    const departement = allDepartements.find(
      (departement) => departement.numero === row.departement
    );
    return departement ? [departement.id] : [];
  }
  return [];
};

const createRoles = async (row: RoleCsvRow, departementIds: number[]) => {
  await prisma.role.create({
    data: {
      emailPattern: row.emailPattern,
      group: row.group as RoleGroup,
      roleDepartements: {
        create: departementIds.map((id) => ({ departementId: id })),
      },
    },
  });
};

const createAnonymousRole = async () => {
  await prisma.role.create({
    data: {
      group: "ANONYMOUS",
      roleDepartements: {
        create: [],
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

    await prisma.roleDepartement.deleteMany({});
    await prisma.role.deleteMany({});

    await createAnonymousRole();
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
