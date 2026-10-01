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
import { StructureApiRead } from "@/schemas/api/structure.schema";
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
  } else if (user && user.operateurId === null) {
    defineAgentRules(builder, user);
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
  can("update", ["Cpom", "Operateur"]);
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

export const canUpdateStructure = (
  user: SessionUser,
  structure: Structure | StructureApiRead
) => {
  const ability = defineAbilityFor(user);
  return ability.can("update", subject("Structure", structure as Structure));
};

export const canUpdateDepartement = (
  user: SessionUser,
  departementAdministratif?: string | null
) => {
  const ability = defineAbilityFor(user);
  return ability.can(
    "update",
    subject("Structure", { departementAdministratif } as Structure)
  );
};

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
      return canUpdateDepartement(
        user,
        acte.structure?.departementAdministratif
      );
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
    return canUpdateDepartement(
      user,
      file.documentFinancier?.structure?.departementAdministratif
    );
  }
  if (file.controleId) {
    return canUpdateDepartement(
      user,
      file.controle?.structure?.departementAdministratif
    );
  }
  if (file.evaluationId) {
    return canUpdateDepartement(
      user,
      file.evaluation?.structure?.departementAdministratif
    );
  }
  if (file.operateur) {
    return ability.can("update", subject("Operateur", file.operateur));
  }

  return false;
};
