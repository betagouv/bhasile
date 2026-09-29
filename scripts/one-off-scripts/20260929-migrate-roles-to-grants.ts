// One-off script: convertit les Role / RoleDepartement en binômes rôle × périmètre
// - Pattern d'email → droits de base : EDITEUR national, ou VIEWER national + EDITEUR sur sa zone
// - Rôle manuel d'un utilisateur → une ligne EDITEUR sur sa zone
// Idempotent : les périmètres sont retrouvés par nom, les binômes créés avec skipDuplicates.
// Usage: yarn one-off 20260929-migrate-roles-to-grants

import "dotenv/config";

import {
  AgentZone,
  findOrCreatePerimetre,
  getAgentBaseGrants,
} from "scripts/utils/perimetre.util";

import { AccessRole, Prisma } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

type RoleWithDepartements = Prisma.RoleGetPayload<{
  include: {
    roleDepartements: { include: { departement: true } };
  };
}>;

type RegionWithDepartements = Prisma.RegionGetPayload<{
  include: { departements: { select: { numero: true } } };
}>;

const prisma = createPrismaClient();

const getRoleZone = (
  role: RoleWithDepartements,
  regions: RegionWithDepartements[]
): AgentZone | null => {
  if (role.name === "NATIONAL") {
    return { kind: "national" };
  }

  const departementNumeros = role.roleDepartements
    .map(({ departementNumero }) => departementNumero)
    .sort();
  if (departementNumeros.length === 0) {
    return null;
  }

  const region = regions.find(({ departements }) => {
    const regionNumeros = departements.map(({ numero }) => numero).sort();
    return regionNumeros.join(",") === departementNumeros.join(",");
  });
  if (region) {
    return { kind: "region", regionId: region.id, name: region.name };
  }

  return {
    kind: "departements",
    departementNumeros,
    name:
      departementNumeros.length === 1
        ? role.roleDepartements[0].departement.name
        : role.name,
  };
};

const migrateEmailPatterns = async (
  roleId: number,
  zone: AgentZone
): Promise<number> => {
  const emailPatterns = await prisma.emailPattern.findMany({
    where: { roleId },
    select: { id: true },
  });
  const grants = await getAgentBaseGrants(prisma, zone);

  const { count } = await prisma.emailPatternGrant.createMany({
    data: emailPatterns.flatMap(({ id }) =>
      grants.map((grant) => ({ ...grant, emailPatternId: id }))
    ),
    skipDuplicates: true,
  });
  return count;
};

const migrateManualUsers = async (
  roleId: number,
  zone: AgentZone
): Promise<number> => {
  const users = await prisma.user.findMany({
    where: { roleId },
    select: { id: true },
  });
  const perimetreId = await findOrCreatePerimetre(prisma, zone);

  const { count } = await prisma.userGrant.createMany({
    data: users.map(({ id }) => ({
      userId: id,
      role: AccessRole.EDITEUR,
      perimetreId,
    })),
    skipDuplicates: true,
  });
  return count;
};

const migrateRolesToGrants = async () => {
  console.log("➡️ Démarrage de la conversion des rôles en binômes");

  const [roles, regions] = await Promise.all([
    prisma.role.findMany({
      include: { roleDepartements: { include: { departement: true } } },
    }),
    prisma.region.findMany({
      include: { departements: { select: { numero: true } } },
    }),
  ]);

  for (const role of roles) {
    const zone = getRoleZone(role, regions);
    if (!zone) {
      console.log(`⏭️ ${role.name} : aucun département, ignoré`);
      continue;
    }

    const emailPatternGrantCount = await migrateEmailPatterns(role.id, zone);
    const userGrantCount = await migrateManualUsers(role.id, zone);
    console.log(
      `✔️ ${role.name} → ${zone.kind === "national" ? "national" : zone.name} : ${emailPatternGrantCount} binômes de pattern, ${userGrantCount} binômes utilisateur`
    );
  }

  console.log("✅ Conversion des rôles en binômes terminée.");
};

migrateRolesToGrants()
  .catch((error) => {
    console.error("❌ Erreur pendant la conversion des rôles :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
