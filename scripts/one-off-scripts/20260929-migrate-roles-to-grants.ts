// One-off script: convertit les Role / RoleDepartement en binômes rôle × niveau géographique
// Pattern d'email et rôle manuel reçoivent les mêmes binômes :
// EDITEUR national, ou VIEWER national + EDITEUR sur sa zone.
// Les binômes d'un utilisateur remplacent ceux de son pattern, comme le rôle manuel aujourd'hui.
// Un rôle couvrant une région entière donne un binôme région, sinon un binôme par département.
// Idempotent : seuls les patterns et utilisateurs sans aucun binôme sont migrés,
// un binôme modifié ou retiré depuis n'est donc jamais recréé.
// Lancé par scripts/postdeploy.sh jusqu'à la suppression des tables Role.
// Usage: yarn one-off 20260929-migrate-roles-to-grants

import "dotenv/config";

import { AgentZone, getAgentBaseGrants } from "scripts/utils/grant.util";

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
    where: { roleId, grants: { none: {} } },
    select: { id: true },
  });
  const grants = getAgentBaseGrants(zone);

  const { count } = await prisma.grant.createMany({
    data: emailPatterns.flatMap(({ id }) =>
      grants.map((grant) => ({ ...grant, emailPatternId: id }))
    ),
  });
  return count;
};

const migrateManualUsers = async (
  roleId: number,
  zone: AgentZone
): Promise<number> => {
  const users = await prisma.user.findMany({
    where: { roleId, grants: { none: {} } },
    select: { id: true },
  });
  const grants = getAgentBaseGrants(zone);

  const { count } = await prisma.grant.createMany({
    data: users.flatMap(({ id }) =>
      grants.map((grant) => ({ ...grant, userId: id }))
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
