import { PerimeterDb, UserWithGrants } from "@/app/api/users/user.db.type";
import { getAccountStatus, toSessionGrant } from "@/app/api/users/user.util";
import { toDayKey } from "@/app/utils/date.util";
import { AccessRole, GrantScope } from "@/generated/prisma/client";
import { postToBrevo } from "@/lib/brevo";

const BATCH_SIZE = 500;
const AGENT_STATUT = "Agent";

export type BrevoContact = {
  email: string;
  attributes: {
    DEPARTEMENT: string;
    STATUT: string;
    PERIMETRE: string;
    LAST_LOGIN: string;
    CREATION_COMPTE: string;
    ACTIVE_USER: boolean;
  };
};

export type BrevoAgentUser = Pick<
  UserWithGrants,
  "isActivated" | "deactivatedAt" | "perimeter"
> & {
  email: string;
  lastConnection: Date | null;
  createdAt: Date;
};

export const toBrevoContact = (user: BrevoAgentUser): BrevoContact => {
  const isActivated = getAccountStatus(user) === "ACTIVATED";
  const perimeter = isActivated ? user.perimeter : null;

  return {
    email: user.email,
    attributes: {
      DEPARTEMENT: perimeter ? formatDepartements(perimeter) : "",
      STATUT: AGENT_STATUT,
      PERIMETRE: perimeter ? getPerimeterLabel(perimeter) : "",
      LAST_LOGIN: user.lastConnection ? toDayKey(user.lastConnection) : "",
      CREATION_COMPTE: toDayKey(user.createdAt),
      ACTIVE_USER: isActivated,
    },
  };
};

export const pushContactsToBrevo = async (
  contacts: BrevoContact[]
): Promise<void> => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("❌ BREVO_API_KEY n'est pas défini dans l'environnement");
  }

  const listId = Number(process.env.BREVO_USERS_LIST_ID);
  if (!process.env.BREVO_USERS_LIST_ID || !Number.isInteger(listId)) {
    throw new Error(
      "❌ BREVO_USERS_LIST_ID n'est pas défini ou n'est pas un entier"
    );
  }

  for (let start = 0; start < contacts.length; start += BATCH_SIZE) {
    const batch = contacts.slice(start, start + BATCH_SIZE);

    await postToBrevo("/contacts/import", {
      listIds: [listId],
      updateExistingContacts: true,
      emptyContactsAttributes: false,
      jsonBody: batch,
    });

    console.log(
      `📤 ${batch.length} contacts envoyés à la liste Brevo ${listId}`
    );
  }
};

const formatDepartements = (perimeter: PerimeterDb): string =>
  toSessionGrant({ ...perimeter, role: AccessRole.LECTEUR, structure: null })
    .departementNumeros.sort()
    .join(", ");

const getPerimeterLabel = (perimeter: PerimeterDb): string =>
  perimeter.scope === GrantScope.NATIONAL
    ? "National"
    : (perimeter.region?.name ?? perimeter.departement?.name ?? "");
