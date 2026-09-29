// Remplir les patterns d'email autorisés et leurs droits de base (binômes rôle × périmètre)
// Usage: yarn script fill-roles roles.csv

import "dotenv/config";

import { loadCsvFromS3 } from "scripts/utils/csv-loader";
import { AgentZone, getAgentBaseGrants } from "scripts/utils/perimetre.util";

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
const csvFilename = args[0] ?? "roles_v2.csv";

const fetchRoles = async (): Promise<RoleCsvRow[]> => {
  return loadCsvFromS3<RoleCsvRow>(process.env.DOCS_BUCKET_NAME!, csvFilename);
};

const getAgentZone = (
  row: RoleCsvRow,
  allDepartements: DepartementWithRegion[]
): AgentZone | null => {
  if (row.name === "NATIONAL") {
    return { kind: "national" };
  }
  if (row.name.startsWith("REGION")) {
    const region = allDepartements.find(
      (departement) => departement.regionAdministrative?.code === row.region
    )?.regionAdministrative;
    return region
      ? { kind: "region", regionId: region.id, name: region.name }
      : null;
  }
  if (row.name.startsWith("DEPARTEMENT")) {
    const departement = allDepartements.find(
      (departement) => departement.numero === row.departement
    );
    return departement
      ? {
          kind: "departements",
          departementNumeros: [departement.numero],
          name: departement.name,
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
    select: { id: true },
  });

  const grants = await getAgentBaseGrants(prisma, zone);
  await prisma.emailPatternGrant.createMany({
    data: grants.map((grant) => ({
      ...grant,
      emailPatternId: emailPattern.id,
    })),
    skipDuplicates: true,
  });
};

const run = async () => {
  try {
    console.log("🧑 Création des droits de base par pattern d'email");
    const [csvRows, allDepartements] = await Promise.all([
      fetchRoles(),
      prisma.departement.findMany({ include: { regionAdministrative: true } }),
    ]);

    for (const row of csvRows) {
      const zone = getAgentZone(row, allDepartements);
      if (!zone) {
        console.warn(`⚠️ Ligne ignorée, périmètre introuvable : ${row.name}`);
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
