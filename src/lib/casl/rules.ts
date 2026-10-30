import { AbilityBuilder, PureAbility } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";

import type {
  Cpom,
  Operateur,
  Prisma,
  Structure,
  User,
} from "@/generated/prisma/client";
import { AccessRole, CpomGranularity } from "@/generated/prisma/enums";
import { SessionGrant, SessionPermissions } from "@/types/global";

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

export const defineAbilityFor = (user?: SessionPermissions) => {
  return createPrismaAbility(defineRulesFor(user));
};

const defineRulesFor = (user?: SessionPermissions) => {
  const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);
  if (!user || !canAccessApp(user)) {
    return builder.rules;
  }
  defineReadRules(builder, user);

  if (user.isSuperAdmin) {
    builder.can("manage", "all");
  } else if (isAgent(user)) {
    defineAgentRules(builder, user);
  }

  return builder.rules;
};

const defineReadRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: SessionPermissions
) => {
  const operateurCondition =
    user.operateurId === null ? {} : { operateurId: user.operateurId };

  for (const conditions of user.grants.flatMap(getStructureConditions)) {
    can(
      "read",
      "Structure",
      toRuleConditions({ ...conditions, ...operateurCondition })
    );
  }
  if (isAgent(user)) {
    for (const conditions of user.grants.flatMap(getCpomConditions)) {
      can("read", "Cpom", toRuleConditions(conditions));
    }
  }
  can("read", "Operateur");
};

const defineAgentRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: SessionPermissions
) => {
  const editingGrants = user.grants.filter((grant) =>
    EDITING_ROLES.includes(grant.role)
  );
  if (editingGrants.length === 0) {
    return;
  }

  for (const conditions of editingGrants.flatMap(getStructureConditions)) {
    can("update", "Structure", toRuleConditions(conditions));
  }

  for (const conditions of editingGrants.flatMap(getCpomConditions)) {
    can("update", "Cpom", toRuleConditions(conditions));
  }
  can("update", "Operateur");
};

// Prisma traduit `OR: [{}]` par « aucune ligne » : une règle sans restriction
// doit être déclarée sans conditions pour qu'accessibleBy renvoie `{}`.
const toRuleConditions = <T extends object>(conditions: T): T | undefined =>
  Object.keys(conditions).length > 0 ? conditions : undefined;

export const EDITING_ROLES: AccessRole[] = [
  AccessRole.EDITEUR,
  AccessRole.ADMIN,
];

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
  regionIds,
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
    ...(regionIds.length > 0
      ? [
          {
            granularity: CpomGranularity.REGIONALE,
            regionId: { in: regionIds },
          },
        ]
      : []),
    ...(structureIds.length > 0
      ? [{ structures: { some: { structureId: { in: structureIds } } } }]
      : []),
  ];
};

export const isAgent = (user: SessionPermissions | undefined): boolean =>
  user?.isAgent === true;

export const canAccessApp = (user: SessionPermissions): boolean =>
  user.isSuperAdmin || (user.grants?.length ?? 0) > 0;

export const NO_RECORD_WHERE = { id: { in: [] } };
