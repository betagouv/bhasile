// Remplir les patterns d'email autorisés et leurs droits de base (binômes rôle × niveau géographique)
// Le CSV fait foi : les binômes d'un pattern présent dans le fichier sont remplacés, pas cumulés.
// Plusieurs lignes pour un même pattern s'additionnent. Un pattern absent du fichier n'est pas touché.
// Usage: yarn script fill-roles roles.csv

import "dotenv/config";

import { loadCsvFromS3 } from "scripts/utils/csv-loader";
import {
  AgentGrant,
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

const replaceEmailPatternGrants = async (
  pattern: string,
  grants: AgentGrant[]
) => {
  const emailPattern = await prisma.emailPattern.upsert({
    where: { pattern },
    update: {},
    create: { pattern },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.grant.deleteMany({ where: { emailPatternId: emailPattern.id } }),
    prisma.grant.createMany({
      data: grants.map((grant) => ({
        ...grant,
        emailPatternId: emailPattern.id,
      })),
    }),
  ]);
};

const run = async () => {
  try {
    console.log("🧑 Remplacement des droits de base par pattern d'email");
    const [csvRows, regions, departements] = await Promise.all([
      fetchRoles(),
      prisma.region.findMany(),
      prisma.departement.findMany(),
    ]);

    const grantsByPattern = new Map<string, AgentGrant[]>();
    for (const row of csvRows) {
      const pattern = row.emailPattern?.trim();
      if (!pattern) {
        continue;
      }
      const zone = getAgentZone(row, regions, departements);
      if (!zone) {
        console.warn(`⚠️ Ligne ignorée, niveau introuvable : ${row.name}`);
        continue;
      }
      const grants = grantsByPattern.get(pattern) ?? [];
      const newGrants = getAgentBaseGrants(zone).filter(
        (grant) => !grants.some((existing) => isSameGrant(existing, grant))
      );
      grantsByPattern.set(pattern, [...grants, ...newGrants]);
    }

    for (const [pattern, grants] of grantsByPattern) {
      await replaceEmailPatternGrants(pattern, grants);
    }
    console.log("✅ Droits de base remplacés");
  } catch (error) {
    console.error("❌ Erreur lors du remplacement des droits de base :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

run();
