import { Session, User } from "next-auth";

import { getContactStructureIds } from "@/app/api/contacts/contact.service";
import { getUserWithGrantsByEmail } from "@/app/api/users/user.repository";
import {
  getAccountStatus,
  getAssignedGrants,
  isAgentUser,
  normalizeEmail,
  toContactGrant,
  toSessionGrant,
} from "@/app/api/users/user.util";
import { SessionGrant, SessionPermissions } from "@/types/global";

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
  const email = session.user?.email ? normalizeEmail(session.user.email) : null;
  const databaseUser = await getUserWithGrantsByEmail({ email });

  if (!databaseUser || !email) {
    return {
      operateurId: null,
      isSuperAdmin: false,
      isAgent: false,
      grants: [],
    };
  }

  const status = getAccountStatus(databaseUser);
  const isActivated = status === "ACTIVATED";
  const isAgent = isActivated && isAgentUser(databaseUser);
  return {
    operateurId: databaseUser.operateurId,
    isSuperAdmin: isActivated && databaseUser.isSuperAdmin,
    isAgent,
    grants: [
      ...getAssignedGrants(databaseUser).map(toSessionGrant),
      ...(isAgent || status === "DEACTIVATED"
        ? []
        : await getContactGrants(email)),
    ],
  };
};

const getContactGrants = async (email: string): Promise<SessionGrant[]> =>
  process.env.CONTACT_ACCESS_ENABLED === "true"
    ? (await getContactStructureIds(email)).map(toContactGrant)
    : [];
