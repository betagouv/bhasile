import { Session, User } from "next-auth";

import {
  getAllAllowedUsers,
  getAllowedUserPatterns,
} from "@/app/api/allowed-user/allowed-user.repository";
import { AllowedUserGranularity, UserRole } from "@/generated/prisma/client";

export type ProConnectUser = User & {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  poste: string;
  role: string;
};

export const getIsUserAuthorized = async (email: string): Promise<boolean> => {
  const allowedPatterns = await getAllowedUserPatterns();
  return allowedPatterns.some(({ emailPattern }) => {
    const regex = new RegExp(emailPattern, "i");
    return regex.test(email);
  });
};

export const getRoleFromSession = async (
  session: Session
): Promise<UserRole> => {
  const allowedUsers = await getAllAllowedUsers();
  const userEmail = session.user?.email;
  if (!userEmail) {
    return UserRole.ANONYMOUS;
  }
  const allowedUser = allowedUsers.find((allowedUser) => {
    const regex = new RegExp(allowedUser.emailPattern, "i");
    if (regex.test(userEmail)) {
      return allowedUser;
    }
    return;
  });

  return convertAllowedUserGranularityToUserRole(allowedUser?.granularity);
};

const convertAllowedUserGranularityToUserRole = (
  granularity?: AllowedUserGranularity
): UserRole => {
  if (!granularity) {
    return UserRole.ANONYMOUS;
  }

  const roles: Record<AllowedUserGranularity, UserRole> = {
    [AllowedUserGranularity.DEPARTEMENT]: UserRole.AGENT_DEPARTEMENTAL,
    [AllowedUserGranularity.REGION]: UserRole.AGENT_REGIONAL,
    [AllowedUserGranularity.NATIONAL]: UserRole.AGENT_NATIONAL,
  };
  return roles[granularity];
};
