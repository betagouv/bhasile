import { AbilityBuilder, PureAbility, subject } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";

import type { FileWithParents } from "@/app/api/files/file.db.type";
import { getTransformationDepartement } from "@/app/utils/transformation.util";
import { Cpom, Operateur, Structure, User } from "@/generated/prisma/client";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";
import { SessionUser } from "@/types/global";

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
  if (!user) {
    defineAnonymousRules(builder);
    return builder.rules;
  }

  if (
    user.role === "NATIONAL" ||
    user.role.startsWith("DEPARTEMENT") ||
    user.role.startsWith("REGION")
  ) {
    defineAgentRules(builder, user);
  } else {
    defineAnonymousRules(builder);
  }

  return builder.rules;
};

const defineAgentRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: SessionUser
) => {
  if (user.role === "NATIONAL") {
    can("update", "Structure");
  } else {
    can("update", "Structure", {
      departementAdministratif: { in: user.allowedDepartements },
    });
  }
  can("update", ["Cpom", "Operateur"]);
};

const defineAnonymousRules = ({ can }: AbilityBuilder<AppAbility>) => {
  can("read", ["Structure", "Cpom", "Operateur"]);
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

export const canUpdateTransformation = (
  user: SessionUser,
  transformation: TransformationApiRead
) => canUpdateDepartement(user, getTransformationDepartement(transformation));

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
