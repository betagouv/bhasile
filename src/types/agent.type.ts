import { AccountStatus } from "@/app/api/users/user.util";
import { GrantScope } from "@/generated/prisma/enums";

export type AgentRead = {
  id: number;
  email: string;
  name: string | null;
  status: AccountStatus;
  perimeter: { id: number; name: string } | null;
  lastConnection: string | null;
};

export type PerimeterRead = {
  id: number;
  name: string;
  zoneKey: string | null;
  zoneLabel: string;
};

export type ZoneOption = {
  scope: typeof GrantScope.DEPARTEMENT | typeof GrantScope.REGION;
  id: string;
  name: string;
};
