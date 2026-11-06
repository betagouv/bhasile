import { Session, User } from "next-auth";

import { getContactStructureIds } from "@/app/api/contacts/contact.service";
import { getUserWithGrantsByEmail } from "@/app/api/users/user.repository";
import {
  getAssignedGrants,
  isAgentUser,
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
  const email = session.user?.email;
  const databaseUser = await getUserWithGrantsByEmail({ email });

  if (!databaseUser || !email) {
    return {
      operateurId: null,
      isSuperAdmin: false,
      isAgent: false,
      grants: [],
    };
  }

  const isAgent = isAgentUser(databaseUser);
  return {
    operateurId: databaseUser.operateurId,
    isSuperAdmin: databaseUser.isSuperAdmin,
    isAgent,
    grants: [
      ...getAssignedGrants(databaseUser).map(toSessionGrant),
      ...(isAgent ? [] : await getContactGrants(email)),
    ],
  };
};

const getContactGrants = async (email: string): Promise<SessionGrant[]> =>
  process.env.CONTACT_ACCESS_ENABLED === "true"
    ? (await getContactStructureIds(email)).map(toContactGrant)
    : [];
