import { Session, User } from "next-auth";

import {
  getAllRoles,
  getAnonymousRole,
  getRolePatterns,
} from "@/app/api/role/role.repository";
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
  const allowedPatterns = await getRolePatterns();
  return allowedPatterns.some(({ emailPattern }) => {
    if (!emailPattern) {
      return false;
    }
    const regex = new RegExp(emailPattern, "i");
    return regex.test(email);
  });
};

export const getRoleFromSession = async (
  session: Session
): Promise<RoleWithDepartements> => {
  const userEmail = session.user?.email;
  const roles = await getAllRoles();
  const anonymousRole = await getAnonymousRole();
  const anonymousRoleWithDepartements = {
    ...anonymousRole,
    allowedDepartements: [],
  };
  if (!userEmail) {
    return anonymousRoleWithDepartements;
  }
  const role = roles.find((role) => {
    if (!role.emailPattern) {
      return;
    }
    const regex = new RegExp(role.emailPattern, "i");
    if (regex.test(userEmail)) {
      return role;
    }
    return;
  });
  if (!role) {
    return anonymousRoleWithDepartements;
  }
  const roleWithDepartements = {
    ...role,
    allowedDepartements: role?.roleDepartements.map(
      (roleDepartement) => roleDepartement.departement.numero
    ),
  };
  return roleWithDepartements || anonymousRole;
};
