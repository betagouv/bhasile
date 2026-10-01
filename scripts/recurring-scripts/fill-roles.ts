// Remplir les patterns d'email autorisés et leurs droits de base (binômes rôle × niveau géographique)
// Usage: yarn script fill-roles roles.csv

import "dotenv/config";

import { loadCsvFromS3 } from "scripts/utils/csv-loader";
import {
  AgentZone,
  getAgentBaseGrants,
  isSameGrant,
} from "scripts/utils/grant.util";

import { Departement, GrantScope, Region } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

type RoleCsvRow = {
  name: string;
  departement: string;
  region: string;
  emailPattern: string;
};

const prisma = createPrismaClient();

const args = process.argv.slice(2);
const csvFilename = args[0] ?? "roles_v2.csv";

const fetchRoles = async (): Promise<RoleCsvRow[]> => {
  return loadCsvFromS3<RoleCsvRow>(process.env.DOCS_BUCKET_NAME!, csvFilename);
};

const getAgentZone = (
  row: RoleCsvRow,
  regions: Region[],
  departements: Departement[]
): AgentZone | null => {
  if (row.name === "NATIONAL") {
    return { scope: GrantScope.NATIONAL };
  }
  if (row.name.startsWith("REGION")) {
    const region = regions.find((region) => region.code === row.region);
    return region ? { scope: GrantScope.REGION, regionId: region.id } : null;
  }
  if (row.name.startsWith("DEPARTEMENT")) {
    const departement = departements.find(
      (departement) => departement.numero === row.departement
    );
    return departement
      ? {
          scope: GrantScope.DEPARTEMENT,
          departementNumeros: [departement.numero],
        }
      : null;
  }
  return null;
};

const fillEmailPattern = async (row: RoleCsvRow, zone: AgentZone) => {
  const pattern = row.emailPattern?.trim();
  if (!pattern) {
    return;
  }

  const emailPattern = await prisma.emailPattern.upsert({
    where: { pattern },
    update: {},
    create: { pattern },
    select: { id: true, grants: true },
  });

  const missingGrants = getAgentBaseGrants(zone).filter(
    (grant) =>
      !emailPattern.grants.some((existing) => isSameGrant(existing, grant))
  );
  await prisma.grant.createMany({
    data: missingGrants.map((grant) => ({
      ...grant,
      emailPatternId: emailPattern.id,
    })),
  });
};

const run = async () => {
  try {
    console.log("🧑 Création des droits de base par pattern d'email");
    const [csvRows, regions, departements] = await Promise.all([
      fetchRoles(),
      prisma.region.findMany(),
      prisma.departement.findMany(),
    ]);

    for (const row of csvRows) {
      const zone = getAgentZone(row, regions, departements);
      if (!zone) {
        console.warn(`⚠️ Ligne ignorée, niveau introuvable : ${row.name}`);
        continue;
      }
      await fillEmailPattern(row, zone);
    }
    console.log("✅ Droits de base créés");
  } catch (error) {
    console.error("❌ Erreur lors de la création des droits de base :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

run();
