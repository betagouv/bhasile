// Remplir la table Roles avec les patterns d'email autorisés pour l'authentification et les groupes de permissions
// Usage: yarn script fill-roles

import "dotenv/config";

import { loadCsvFromS3 } from "scripts/utils/csv-loader";

import { Departement } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

type RoleCsvRow = {
  name: string;
  departement: string;
  emailPattern: string;
};

const prisma = createPrismaClient();

const getRegionNameRoleName = (name: string): string | undefined => {
  const regions: Record<string, string> = {
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
  };
  return regions[name];
};

const fetchRoles = async (): Promise<RoleCsvRow[]> => {
  return loadCsvFromS3<RoleCsvRow>(
    process.env.DOCS_BUCKET_NAME!,
    // TODO : remettre roles.csv ici
    "roles_test.csv"
  );
};

const getTargetDepartementIds = (
  row: RoleCsvRow,
  allDepartements: Departement[]
): number[] => {
  if (row.name === "NATIONAL") {
    return allDepartements.map((departement) => departement.id);
  }
  if (row.name.startsWith("REGION")) {
    const region = getRegionNameRoleName(row.name);
    if (!region) {
      return [];
    }
    return allDepartements
      .filter((departement) => departement.region === region)
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
      prisma.departement.findMany(),
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
