import { getUserRole } from "@/app/api/users/user.util";
import { toDayKey } from "@/app/utils/date.util";

const BREVO_IMPORT_URL = "https://api.brevo.com/v3/contacts/import";
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
  };
};

export type BrevoAgentUser = {
  email: string;
  lastConnection: Date;
  createdAt: Date;
  role: BrevoAgentRole | null;
  emailPattern: { role: BrevoAgentRole } | null;
};

export const toBrevoContact = (user: BrevoAgentUser): BrevoContact => {
  const role = getUserRole(user);

  return {
    email: user.email,
    attributes: {
      DEPARTEMENT: formatDepartements(role),
      STATUT: AGENT_STATUT,
      PERIMETRE: role?.name ?? "",
      LAST_LOGIN: toDayKey(user.lastConnection),
      CREATION_COMPTE: toDayKey(user.createdAt),
    },
  };
};

export const pushContactsToBrevo = async (
  contacts: BrevoContact[]
): Promise<void> => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
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

    const response = await fetch(BREVO_IMPORT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        listIds: [listId],
        updateExistingContacts: true,
        emptyContactsAttributes: false,
        jsonBody: batch,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `❌ Brevo a répondu ${response.status} ${response.statusText} : ${await response.text()}`
      );
    }

    console.log(
      `📤 ${batch.length} contacts envoyés à la liste Brevo ${listId}`
    );
  }
};

type BrevoAgentRole = {
  name: string;
  roleDepartements: { departementNumero: string }[];
};

const formatDepartements = (role: BrevoAgentRole | null): string =>
  (role?.roleDepartements ?? [])
    .map((roleDepartement) => roleDepartement.departementNumero)
    .sort()
    .join(", ");
