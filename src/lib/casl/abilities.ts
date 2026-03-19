import { AbilityBuilder, PureAbility, subject } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";

import { Structure, User } from "@/generated/prisma/client";
import { SessionUser } from "@/types/global";

export type AppAbility = PureAbility<
  [
    string,
    (
      | "all"
      | Subjects<{
          User: User;
          Structure: Structure;
        }>
    ),
  ],
  PrismaQuery
>;

export const defineAbilityFor = (user: SessionUser) => {
  return createPrismaAbility(defineRulesFor(user));
};

export const defineRulesFor = (user: SessionUser) => {
  const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);

  if (user.role === "NATIONAL") {
    defineAgentNationalRules(builder);
  } else if (user.role.startsWith("DEPARTEMENT")) {
    defineAgentDepartementalRules(builder, user);
  } else if (user.role.startsWith("REGION")) {
    defineAgentRegionalRules(builder, user);
  } else {
    defineAnonymousRules(builder);
  }

  return builder.rules;
};

const defineAgentNationalRules = ({ can }: AbilityBuilder<AppAbility>) => {
  can("update", "Structure", {});
};

const defineAgentRegionalRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: SessionUser
) => {
  can("update", "Structure", {
    departementAdministratif: { in: user.allowedDepartements },
  });
};

const defineAgentDepartementalRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: SessionUser
) => {
  can("update", "Structure", {
    departementAdministratif: { in: user.allowedDepartements },
  });
};

const defineAnonymousRules = ({ can }: AbilityBuilder<AppAbility>) => {
  can("read", ["Structure"]);
};

export const canUpdateStructure = (user: SessionUser, structure: Structure) => {
  const ability = defineAbilityFor(user);
  return ability.can("update", subject("Structure", structure));
};
