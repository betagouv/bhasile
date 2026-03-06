import { AbilityBuilder, PureAbility } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";

import { Structure, User, UserRole } from "@/generated/prisma/client";

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

export const defineAbilityFor = (user: User) => {
  return createPrismaAbility(defineRulesFor(user));
};

export const defineRulesFor = (user: User) => {
  const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);
  const roles: Record<UserRole, () => void> = {
    ADMIN: () => defineAdminRules(builder),
    AGENT_NATIONAL: () => defineAgentNationalRules(builder),
    AGENT_REGIONAL: () => defineAgentRegionalRules(builder, user),
    AGENT_DEPARTEMENTAL: () => defineAgentDepartementalRules(builder, user),
    ANONYMOUS: () => defineAnonymousRules(builder),
  };
  roles[user?.role]();

  return builder.rules;
};

const defineAdminRules = ({ can }: AbilityBuilder<AppAbility>) => {
  can("manage", "all");
};

const defineAgentNationalRules = ({ can }: AbilityBuilder<AppAbility>) => {
  can(["read", "create", "delete", "update"], "Structure", {});
};

const defineAgentRegionalRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: User
) => {
  can(["read", "create", "delete", "update"], "Structure", {
    author: user.id,
  });
};

const defineAgentDepartementalRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: User
) => {
  can(["read", "create", "delete", "update"], "Structure", {
    author: user.id,
  });
};

const defineAnonymousRules = ({ can }: AbilityBuilder<AppAbility>) => {
  can("read", ["Structure"], { published: true });
};
