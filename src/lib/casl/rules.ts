import { AbilityBuilder, PureAbility } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";

import type {
  Cpom,
  Operateur,
  Prisma,
  Structure,
  User,
} from "@/generated/prisma/client";
import { AccessRole } from "@/generated/prisma/enums";
import { SessionGrant, SessionUser } from "@/types/global";

export type AppAbility = PureAbility<
  [
    string,
    (
      | "all"
      | Subjects<{
          User: User;
          Structure: Structure;
          Cpom: Cpom;
          Operateur: Operateur;
        }>
    ),
  ],
  PrismaQuery
>;

export const defineAbilityFor = (user?: SessionUser) => {
  return createPrismaAbility(defineRulesFor(user));
};

const defineRulesFor = (user?: SessionUser) => {
  const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);
  if (!user || !canAccessApp(user)) {
    return builder.rules;
  }
  defineReadRules(builder, user);

  if (user.isSuperAdmin) {
    builder.can("manage", "all");
  } else if (user.operateurId === null) {
    defineAgentRules(builder, user);
  } else if (typeof user.operateurId === "number") {
    defineOperateurRules(builder, user, user.operateurId);
  }

  return builder.rules;
};

const defineReadRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: SessionUser
) => {
  const operateurCondition =
    user.operateurId === null ? {} : { operateurId: user.operateurId };

  for (const conditions of user.grants.flatMap(getStructureConditions)) {
    can("read", "Structure", { ...conditions, ...operateurCondition });
  }
  for (const conditions of user.grants.flatMap(getCpomConditions)) {
    can("read", "Cpom", { ...conditions, ...operateurCondition });
  }
  can("read", "Operateur");
};

const defineAgentRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: SessionUser
) => {
  const editingGrants = user.grants.filter((grant) =>
    EDITING_ROLES.includes(grant.role)
  );
  if (editingGrants.length === 0) {
    return;
  }

  for (const conditions of editingGrants.flatMap(getStructureConditions)) {
    can("update", "Structure", conditions);
  }

  for (const conditions of editingGrants.flatMap(getCpomConditions)) {
    can("update", "Cpom", conditions);
  }
  can("update", "Operateur");
};

const defineOperateurRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: SessionUser,
  operateurId: number
) => {
  if (user.grants.some((grant) => grant.role === AccessRole.ADMIN)) {
    can("update", "Operateur", { id: operateurId });
  }
};

const EDITING_ROLES: AccessRole[] = [AccessRole.EDITEUR, AccessRole.ADMIN];

const getStructureConditions = ({
  isNational,
  departementNumeros,
  structureIds,
}: SessionGrant): Prisma.StructureWhereInput[] => {
  if (isNational) {
    return [{}];
  }

  return [
    ...(departementNumeros.length > 0
      ? [{ departementAdministratif: { in: departementNumeros } }]
      : []),
    ...(structureIds.length > 0 ? [{ id: { in: structureIds } }] : []),
  ];
};

const getCpomConditions = ({
  isNational,
  departementNumeros,
  structureIds,
}: SessionGrant): Prisma.CpomWhereInput[] => {
  if (isNational) {
    return [{}];
  }

  return [
    ...(departementNumeros.length > 0
      ? [
          {
            departements: {
              some: {
                departement: { is: { numero: { in: departementNumeros } } },
              },
            },
          },
        ]
      : []),
    ...(structureIds.length > 0
      ? [{ structures: { some: { structureId: { in: structureIds } } } }]
      : []),
  ];
};

export const canAccessApp = (user: SessionUser): boolean =>
  user.isSuperAdmin || (user.grants?.length ?? 0) > 0;

export const NO_RECORD_WHERE = { id: { in: [] } };
