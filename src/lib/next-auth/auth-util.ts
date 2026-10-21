import { Session, User } from "next-auth";

import { getUserWithGrantsByEmail } from "@/app/api/users/user.repository";
import { getEffectiveGrants, toSessionGrant } from "@/app/api/users/user.util";
import { SessionUser } from "@/types/global";

export type ProConnectUser = User & {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  poste: string;
};

export const getPermissionsFromSession = async (
  session: Session
): Promise<SessionPermissions> => {
  const databaseUser = await getUserWithGrantsByEmail({
    email: session.user?.email,
  });

  if (!databaseUser) {
    return { operateurId: null, isSuperAdmin: false, grants: [] };
  }

  return {
    operateurId: databaseUser.operateurId,
    isSuperAdmin: databaseUser.isSuperAdmin,
    grants: getEffectiveGrants(databaseUser).map(toSessionGrant),
  };
};

type SessionPermissions = Pick<
  SessionUser,
  "operateurId" | "isSuperAdmin" | "grants"
>;
