import { AbilityBuilder, PureAbility, subject } from "@casl/ability";
import { createPrismaAbility, PrismaQuery, Subjects } from "@casl/prisma";

import { RoleGroup, Structure, User } from "@/generated/prisma/client";

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

type SessionUser = {
  role: string;
};

export const defineAbilityFor = (user: User) => {
  return createPrismaAbility(defineRulesFor(user));
};

export const defineRulesFor = (user: User) => {
  const builder = new AbilityBuilder<AppAbility>(createPrismaAbility);

  const roles: Record<RoleGroup, () => void> = {
    NATIONAL: () => defineAgentNationalRules(builder),
    REGION_ARA: () => defineAgentRegionalRules(builder, user, "ARA"),
    REGION_BFC: () => defineAgentRegionalRules(builder, user, "BFC"),
    REGION_BRE: () => defineAgentRegionalRules(builder, user, "BRE"),
    REGION_CVL: () => defineAgentRegionalRules(builder, user, "CVL"),
    REGION_GES: () => defineAgentRegionalRules(builder, user, "GES"),
    REGION_HDF: () => defineAgentRegionalRules(builder, user, "HDF"),
    REGION_IDF: () => defineAgentRegionalRules(builder, user, "IDF"),
    REGION_NOR: () => defineAgentRegionalRules(builder, user, "NOR"),
    REGION_NAQ: () => defineAgentRegionalRules(builder, user, "NAQ"),
    REGION_OCC: () => defineAgentRegionalRules(builder, user, "OCC"),
    REGION_PDL: () => defineAgentRegionalRules(builder, user, "PDL"),
    REGION_PAC: () => defineAgentRegionalRules(builder, user, "PAC"),
    DEPARTEMENT: () => defineAgentDepartementalRules(builder, user),
    ANONYMOUS: () => defineAnonymousRules(builder),
  };
  roles[user?.role]();

  return builder.rules;
};

const defineAgentNationalRules = ({ can }: AbilityBuilder<AppAbility>) => {
  can(["update"], "Structure", {});
};

const defineAgentRegionalRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: User,
  regionName: string
) => {
  // TODO: handle regions
  console.log(regionName);
  can(["update"], "Structure", {
    userId: user.id,
  });
};

const defineAgentDepartementalRules = (
  { can }: AbilityBuilder<AppAbility>,
  user: User
) => {
  can("update", "Structure", {
    // TODO : update this code
    departmentCode: user.roleId,
  });
};

const defineAnonymousRules = ({ can }: AbilityBuilder<AppAbility>) => {
  can("read", ["Structure"]);
};

export const canUpdateStructure = (user: User, structure: Structure) => {
  const ability = defineAbilityFor(user);
  return ability.can("update", subject("Structure", structure));
};
