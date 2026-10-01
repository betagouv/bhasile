// One-off script: convertit les Role / RoleDepartement en binômes rôle × niveau géographique
// - Pattern d'email → droits de base : EDITEUR national, ou VIEWER national + EDITEUR sur sa zone
// - Rôle manuel d'un utilisateur → EDITEUR sur sa zone
// Un rôle couvrant une région entière donne un binôme région, sinon un binôme par département.
// Idempotent : seuls les binômes manquants sont créés.
// Usage: yarn one-off 20260929-migrate-roles-to-grants

import "dotenv/config";

import {
  AgentZone,
  getAgentBaseGrants,
  getAgentEditeurGrants,
  isSameGrant,
} from "scripts/utils/grant.util";

import { GrantScope, Prisma } from "@/generated/prisma/client";
import { createPrismaClient } from "@/prisma-client";

type RoleWithDepartements = Prisma.RoleGetPayload<{
  include: { roleDepartements: true };
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
    return { scope: GrantScope.NATIONAL };
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
    return { scope: GrantScope.REGION, regionId: region.id };
  }

  return { scope: GrantScope.DEPARTEMENT, departementNumeros };
};

const migrateEmailPatterns = async (
  roleId: number,
  zone: AgentZone
): Promise<number> => {
  const emailPatterns = await prisma.emailPattern.findMany({
    where: { roleId },
    select: { id: true, grants: true },
  });
  const grants = getAgentBaseGrants(zone);

  const { count } = await prisma.emailPatternGrant.createMany({
    data: emailPatterns.flatMap((emailPattern) =>
      grants
        .filter(
          (grant) =>
            !emailPattern.grants.some((existing) =>
              isSameGrant(existing, grant)
            )
        )
        .map((grant) => ({ ...grant, emailPatternId: emailPattern.id }))
    ),
  });
  return count;
};

const migrateManualUsers = async (
  roleId: number,
  zone: AgentZone
): Promise<number> => {
  const users = await prisma.user.findMany({
    where: { roleId },
    select: { id: true, grants: true },
  });
  const grants = getAgentEditeurGrants(zone);

  const { count } = await prisma.userGrant.createMany({
    data: users.flatMap((user) =>
      grants
        .filter(
          (grant) =>
            !user.grants.some((existing) => isSameGrant(existing, grant))
        )
        .map((grant) => ({ ...grant, userId: user.id }))
    ),
  });
  return count;
};

const migrateRolesToGrants = async () => {
  console.log("➡️ Démarrage de la conversion des rôles en binômes");

  const [roles, regions] = await Promise.all([
    prisma.role.findMany({ include: { roleDepartements: true } }),
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
      `✔️ ${role.name} → ${zone.scope} : ${emailPatternGrantCount} binômes de pattern, ${userGrantCount} binômes utilisateur`
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
