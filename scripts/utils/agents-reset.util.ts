import { GrantDb, UserWithGrants } from "@/app/api/users/user.db.type";
import {
  getAccountStatus,
  getAssignedGrants,
  normalizeEmail,
} from "@/app/api/users/user.util";
import { AccessRole, GrantScope } from "@/generated/prisma/client";

export const AGENTS_DOCUMENT_COLUMNS = {
  zone: "Sélectionnez votre département",
  level: "Granularité",
  perimeterName: "Périmètre",
  firstEmail:
    "Saisissez les adresses mail à autoriser (au moins une obligatoire)",
  otherEmailsPrefix: "Untitled email field",
};

export const AGENTS_DOCUMENT_LEVELS: Record<string, PerimeterScope> = {
  DEPARTEMENT: GrantScope.DEPARTEMENT,
  REGION: GrantScope.REGION,
};

export const NATIONAL_READERS_PERIMETER_NAME = "Lecture nationale";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_LABELS: Record<AccessRole, string> = {
  [AccessRole.LECTEUR]: "Lecteur",
  [AccessRole.EDITEUR]: "Éditeur",
  [AccessRole.ADMIN]: "Admin",
};

export const getMissingColumns = (headers: string[]): string[] =>
  [
    AGENTS_DOCUMENT_COLUMNS.zone,
    AGENTS_DOCUMENT_COLUMNS.level,
    AGENTS_DOCUMENT_COLUMNS.perimeterName,
    AGENTS_DOCUMENT_COLUMNS.firstEmail,
  ].filter((column) => !headers.includes(column));

const isEmailColumn = (column: string): boolean =>
  column === AGENTS_DOCUMENT_COLUMNS.firstEmail ||
  column.startsWith(AGENTS_DOCUMENT_COLUMNS.otherEmailsPrefix);

export const parseAgentsDocument = (
  rows: Record<string, string | undefined>[],
  referential: Referential
): { perimeters: DocumentPerimeter[]; errors: string[] } => {
  const errors: string[] = [];
  const perimeters: DocumentPerimeter[] = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const name = row[AGENTS_DOCUMENT_COLUMNS.perimeterName]?.trim() ?? "";
    const level = row[AGENTS_DOCUMENT_COLUMNS.level]?.trim() ?? "";
    const where = `ligne ${line} (${name || "rôle sans nom"})`;

    if (!name) {
      errors.push(`${where} : nom du rôle manquant`);
    }
    const scope = AGENTS_DOCUMENT_LEVELS[level];
    if (!scope) {
      errors.push(`${where} : niveau inconnu « ${level} »`);
      return;
    }
    const zone = resolveZone(row, scope, referential);
    if (!zone) {
      const rawZone = row[AGENTS_DOCUMENT_COLUMNS.zone]?.trim() ?? "";
      errors.push(`${where} : zone introuvable « ${rawZone} »`);
      return;
    }

    const emails = Object.keys(row)
      .filter(isEmailColumn)
      .map((column) => normalizeEmail(row[column] ?? ""))
      .filter((email) => email !== "");
    if (emails.length === 0) {
      errors.push(`${where} : aucune adresse mail`);
    }
    for (const email of emails.filter((email) => !EMAIL_REGEX.test(email))) {
      errors.push(`${where} : adresse mail invalide « ${email} »`);
    }

    perimeters.push({ name, zone, emails, line });
  });

  errors.push(
    ...getDuplicates(perimeters.map(({ name, line }) => [name, line])).map(
      ([name, lines]) =>
        `rôle « ${name} » présent plusieurs fois (lignes ${lines.join(", ")})`
    ),
    ...getDuplicates(
      perimeters.flatMap(({ emails, line }) =>
        emails.map((email): [string, number] => [email, line])
      )
    ).map(
      ([email, lines]) =>
        `${email} présent plusieurs fois (lignes ${lines.join(", ")})`
    )
  );

  return { perimeters, errors };
};

export const findEmailCaseDuplicates = (
  users: { email: string }[]
): string[][] => {
  const emailsByNormalizedEmail = new Map<string, string[]>();
  for (const { email } of users) {
    const key = normalizeEmail(email);
    emailsByNormalizedEmail.set(key, [
      ...(emailsByNormalizedEmail.get(key) ?? []),
      email,
    ]);
  }
  return [...emailsByNormalizedEmail.values()].filter(
    (emails) => emails.length > 1
  );
};

export const planPerimeters = (
  documentPerimeters: DocumentPerimeter[],
  existingPerimeters: ExistingPerimeter[]
): PerimetersPlan => {
  const plan: PerimetersPlan = {
    created: [],
    grantsChanged: [],
    unchanged: [],
    absent: [],
  };
  for (const perimeter of documentPerimeters) {
    const existing = existingPerimeters.find(
      ({ name }) => name === perimeter.name
    );
    if (!existing) {
      plan.created.push(perimeter);
    } else if (
      getGrantsKey(existing.grants) !==
      getGrantsKey(toPerimeterGrants(perimeter.zone))
    ) {
      plan.grantsChanged.push(perimeter);
    } else {
      plan.unchanged.push(perimeter);
    }
  }
  plan.absent = existingPerimeters
    .filter(
      ({ name }) =>
        name !== NATIONAL_READERS_PERIMETER_NAME &&
        !documentPerimeters.some((perimeter) => perimeter.name === name)
    )
    .map(({ name }) => name);
  return plan;
};

export const planAgentsReset = (
  perimeters: DocumentPerimeter[],
  users: ResetUser[]
): AgentsResetPlan => {
  const plan: AgentsResetPlan = {
    agents: [],
    nationalReaders: [],
    deactivated: [],
    superAdmins: [],
    operateurUsers: [],
    inactiveCount: 0,
    errors: [],
    warnings: [],
  };
  const usersByEmail = new Map(
    users.map((user) => [normalizeEmail(user.email), user])
  );
  const documentEmails = new Set<string>();

  const reservedPerimeter = perimeters.find(
    ({ name }) => name === NATIONAL_READERS_PERIMETER_NAME
  );
  if (reservedPerimeter) {
    plan.errors.push(
      `ligne ${reservedPerimeter.line} : « ${NATIONAL_READERS_PERIMETER_NAME} » est réservé aux éditeurs nationaux absents du document`
    );
  }

  for (const perimeter of perimeters) {
    for (const email of perimeter.emails) {
      const user = usersByEmail.get(email) ?? null;
      if (user?.isSuperAdmin) {
        plan.warnings.push(
          `${email} est superadmin : ignoré dans « ${perimeter.name} », reste superadmin`
        );
        continue;
      }
      documentEmails.add(email);
      if (user?.operateurId) {
        plan.errors.push(
          `${email} est rattaché à un opérateur et ne peut pas rejoindre « ${perimeter.name} »`
        );
        continue;
      }
      plan.agents.push({
        email,
        perimeter,
        user,
        status: getAgentStatus(user, perimeter.name),
        rightsBefore: user ? describeCurrentRights(user) : "aucun compte",
        rightsAfter: `Lecteur national + Admin ${perimeter.zone.label}`,
      });
    }
  }

  for (const user of users) {
    if (documentEmails.has(normalizeEmail(user.email))) {
      continue;
    }
    if (user.isSuperAdmin) {
      plan.superAdmins.push(user);
      continue;
    }
    if (user.operateurId) {
      plan.operateurUsers.push(user);
      continue;
    }
    if (!user.isActivated) {
      plan.inactiveCount++;
      continue;
    }
    const isNational = user.perimeter?.scope === GrantScope.NATIONAL;
    const rights = describeCurrentRights(user);
    if (isNational) {
      plan.nationalReaders.push({ user, rights });
    } else {
      plan.deactivated.push({ user, rights });
    }
  }

  return plan;
};

export const toPerimeterGrants = (zone: PerimeterZone): PerimeterGrant[] => [
  {
    role: AccessRole.ADMIN,
    scope: zone.scope,
    regionId: zone.regionId,
    departementNumero: zone.departementNumero,
  },
];

const resolveZone = (
  row: Record<string, string | undefined>,
  scope: PerimeterScope,
  { regions, departements }: Referential
): PerimeterZone | null => {
  if (scope === GrantScope.REGION) {
    const rawRegion = normalizeLabel(row[AGENTS_DOCUMENT_COLUMNS.zone] ?? "");
    const region = regions.find(
      ({ name }) => normalizeLabel(name) === rawRegion
    );
    return region
      ? {
          scope,
          regionId: region.id,
          departementNumero: null,
          label: region.name,
        }
      : null;
  }
  const numero = (row[AGENTS_DOCUMENT_COLUMNS.zone] ?? "")
    .split(" - ")[0]
    .trim();
  const departement = departements.find(
    (departement) => departement.numero === numero
  );
  return departement
    ? {
        scope,
        regionId: null,
        departementNumero: departement.numero,
        label: `${departement.numero} - ${departement.name}`,
      }
    : null;
};

const normalizeLabel = (label: string): string =>
  label.trim().replace(/[’‘]/g, "'").toLowerCase();

const getDuplicates = <T>(entries: [T, number][]): [T, number[]][] => {
  const linesByKey = new Map<T, number[]>();
  for (const [key, line] of entries) {
    linesByKey.set(key, [...(linesByKey.get(key) ?? []), line]);
  }
  return [...linesByKey.entries()].filter(([, lines]) => lines.length > 1);
};

const getAgentStatus = (
  user: ResetUser | null,
  perimeterName: string
): AgentStatus => {
  if (!user) {
    return "CREATED";
  }
  return user.isActivated && user.perimeter?.name === perimeterName
    ? "SAME_RIGHTS"
    : "DIFFERENT_RIGHTS";
};

const ACCOUNT_STATUS_LABELS = {
  PENDING: " [en attente]",
  ACTIVATED: "",
  DEACTIVATED: " [désactivé]",
};

const describeCurrentRights = (user: ResetUser): string => {
  const grants = getAssignedGrants(user).map(describeGrant).join(" + ");
  const perimeter = user.perimeter
    ? ` [périmètre : ${user.perimeter.name}]`
    : "";
  return `${grants || "aucun accès"}${perimeter}${ACCOUNT_STATUS_LABELS[getAccountStatus(user)]}`;
};

const describeGrant = (grant: GrantDb): string => {
  const role = ROLE_LABELS[grant.role];
  if (grant.scope === GrantScope.NATIONAL) {
    return `${role} national`;
  }
  if (grant.scope === GrantScope.REGION) {
    return `${role} ${grant.region?.name ?? "région inconnue"}`;
  }
  if (grant.scope === GrantScope.DEPARTEMENT) {
    return grant.departement
      ? `${role} ${grant.departement.numero} - ${grant.departement.name}`
      : `${role} département inconnu`;
  }
  return `${role} ${grant.structure?.codeBhasile ?? "structure inconnue"}`;
};

const getGrantsKey = (grants: PerimeterGrant[]): string =>
  grants
    .map((grant) => `${grant.role}:${getZoneKey(grant)}`)
    .sort()
    .join("|");

const getZoneKey = (zone: {
  scope: GrantScope;
  regionId: number | null;
  departementNumero: string | null;
}): string => {
  if (zone.scope === GrantScope.REGION) {
    return `${GrantScope.REGION}:${zone.regionId}`;
  }
  if (zone.scope === GrantScope.DEPARTEMENT) {
    return `${GrantScope.DEPARTEMENT}:${zone.departementNumero}`;
  }
  return zone.scope;
};

type PerimeterScope = typeof GrantScope.REGION | typeof GrantScope.DEPARTEMENT;

type Referential = {
  regions: { id: number; name: string }[];
  departements: { numero: string; name: string }[];
};

export type PerimeterZone = {
  scope: PerimeterScope;
  regionId: number | null;
  departementNumero: string | null;
  label: string;
};

export type DocumentPerimeter = {
  name: string;
  zone: PerimeterZone;
  emails: string[];
  line: number;
};

export type PerimeterGrant = {
  role: AccessRole;
  scope: GrantScope;
  regionId: number | null;
  departementNumero: string | null;
};

export type ExistingPerimeter = {
  name: string;
  grants: PerimeterGrant[];
};

export type PerimetersPlan = {
  created: DocumentPerimeter[];
  grantsChanged: DocumentPerimeter[];
  unchanged: DocumentPerimeter[];
  absent: string[];
};

export type ResetUser = Pick<
  UserWithGrants,
  | "id"
  | "isSuperAdmin"
  | "operateurId"
  | "isActivated"
  | "deactivatedAt"
  | "perimeter"
  | "grants"
> & {
  email: string;
  lastConnection: Date | null;
};

type AgentStatus = "CREATED" | "SAME_RIGHTS" | "DIFFERENT_RIGHTS";

export type PlannedAgent = {
  email: string;
  perimeter: DocumentPerimeter;
  user: ResetUser | null;
  status: AgentStatus;
  rightsBefore: string;
  rightsAfter: string;
};

export type PlannedUser = {
  user: ResetUser;
  rights: string;
};

export type AgentsResetPlan = {
  agents: PlannedAgent[];
  nationalReaders: PlannedUser[];
  deactivated: PlannedUser[];
  superAdmins: ResetUser[];
  operateurUsers: ResetUser[];
  inactiveCount: number;
  errors: string[];
  warnings: string[];
};
