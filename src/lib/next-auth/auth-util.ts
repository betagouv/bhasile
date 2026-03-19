import { Session, User } from "next-auth";

import { getEmailPatterns } from "@/app/api/email-patterns/email-pattern.repository";
import { getAnonymousRole } from "@/app/api/role/role.repository";
import { getUserByEmail } from "@/app/api/user/user.repository";
import { Prisma } from "@/generated/prisma/client";

export type ProConnectUser = User & {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  poste: string;
};

type RoleWithDepartements = Prisma.RoleGetPayload<{
  include: { roleDepartements: { include: { departement: true } } };
}> & { allowedDepartements: string[] };

export const getIsUserAuthorized = async (email: string): Promise<boolean> => {
  const allowedPatterns = await getEmailPatterns();
  return allowedPatterns.some(({ pattern }) => {
    if (!pattern) {
      return false;
    }
    const regex = new RegExp(pattern, "i");
    return regex.test(email);
  });
};

export const getRoleFromSession = async (
  session: Session
): Promise<RoleWithDepartements> => {
  const userEmail = session.user?.email;
  const databaseUser = await getUserByEmail({ email: userEmail });
  const anonymousRole = await getAnonymousRole();
  const anonymousRoleWithDepartements = {
    ...anonymousRole,
    allowedDepartements: [],
  };
  if (!userEmail || !databaseUser) {
    return anonymousRoleWithDepartements;
  }
  if (databaseUser.role) {
    return {
      ...databaseUser.role,
      allowedDepartements: databaseUser.role?.roleDepartements.map(
        (roleDepartement) => roleDepartement.departement.numero
      ),
    };
  } else if (databaseUser.emailPattern?.roleId) {
    return {
      ...databaseUser.emailPattern.role,
      allowedDepartements: databaseUser.emailPattern.role?.roleDepartements.map(
        (roleDepartement) => roleDepartement.departement.numero
      ),
    };
  } else {
    return anonymousRoleWithDepartements;
  }
};
