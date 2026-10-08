import { AbilityBuilder, PureAbility, subject } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";

import type { FileWithParents } from "@/app/api/files/file.db.type";
import {
  AccessRole,
  Cpom,
  Operateur,
  Prisma,
  Structure,
  User,
} from "@/generated/prisma/client";
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
  defineAnonymousRules(builder);

  if (user?.isSuperAdmin) {
    builder.can("manage", "all");
  } else if (user?.operateurId === null) {
    defineAgentRules(builder, user);
  } else if (typeof user?.operateurId === "number") {
    defineOperateurRules(builder, user, user.operateurId);
  }

  return builder.rules;
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

const defineAnonymousRules = ({ can }: AbilityBuilder<AppAbility>) => {
  can("read", ["Structure", "Cpom", "Operateur"]);
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

export const canUpdateStructure = (
  user: SessionUser,
  structure?: StructureScope | null
) => {
  const ability = defineAbilityFor(user);
  return ability.can(
    "update",
    subject("Structure", {
      id: structure?.id,
      departementAdministratif: structure?.departementAdministratif,
    } as Structure)
  );
};

export const canAbilityUpdateDepartement = (
  ability: AppAbility,
  departementAdministratif?: string | null
) =>
  ability.can(
    "update",
    subject("Structure", { departementAdministratif } as Structure)
  );

export const canUpdateDepartement = (
  user: SessionUser,
  departementAdministratif?: string | null
) => canAbilityUpdateDepartement(defineAbilityFor(user), departementAdministratif);

export const canDeleteFile = (
  user: SessionUser,
  file: FileWithParents
): boolean => {
  const ability = defineAbilityFor(user);

  if (file.acteAdministratifId) {
    const acte = file.acteAdministratif;
    if (!acte) {
      return false;
    }
    if (acte.structureVersionTransformationId) {
      return true;
    }
    if (acte.structureId) {
      return canUpdateStructure(user, acte.structure);
    }
    if (acte.cpom) {
      return ability.can("update", subject("Cpom", acte.cpom));
    }
    if (acte.operateur) {
      return ability.can("update", subject("Operateur", acte.operateur));
    }
    return false;
  }

  if (file.documentFinancierId) {
    return canUpdateStructure(user, file.documentFinancier?.structure);
  }
  if (file.controleId) {
    return canUpdateStructure(user, file.controle?.structure);
  }
  if (file.evaluationId) {
    return canUpdateStructure(user, file.evaluation?.structure);
  }
  if (file.operateur) {
    return ability.can("update", subject("Operateur", file.operateur));
  }

  return false;
};

type StructureScope = {
  id?: number;
  departementAdministratif?: string | null;
};
