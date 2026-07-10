import { SessionUser } from "@/types/global";

export const PrincipalType = {
  Agent: "agent",
  Operateur: "operateur",
} as const;

export type PrincipalType = (typeof PrincipalType)[keyof typeof PrincipalType];

export type Principal =
  | { type: typeof PrincipalType.Agent; user: SessionUser }
  | { type: typeof PrincipalType.Operateur };
