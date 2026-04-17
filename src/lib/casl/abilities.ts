import { AbilityBuilder, PureAbility, subject } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";

import { Cpom, Operateur, Structure, User } from "@/generated/prisma/client";
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
  can("update", "Structure", {
    departementAdministratif: { in: user.allowedDepartements },
  });
  can("update", "Cpom");
  can("update", "Operateur");
};

const defineAnonymousRules = ({ can }: AbilityBuilder<AppAbility>) => {
  can("read", ["Structure"]);
  can("read", ["Cpom"]);
  can("read", ["Operateur"]);
};

export const canUpdateStructure = (user: SessionUser, structure: Structure) => {
  const ability = defineAbilityFor(user);
  return ability.can("update", subject("Structure", structure));
};
