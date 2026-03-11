import { Session, User } from "next-auth";

import {
  getAllRoles,
  getAnonymousRole,
  getRolePatterns,
} from "@/app/api/role/role.repository";
import { Role } from "@/generated/prisma/client";

export type ProConnectUser = User & {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  poste: string;
  role: string;
};

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

export const getRoleFromSession = async (session: Session): Promise<Role> => {
  const roles = await getAllRoles();
  const userEmail = session.user?.email;
  const anonymousRole = getAnonymousRole();
  if (!userEmail) {
    return anonymousRole;
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

  return role || anonymousRole;
};
