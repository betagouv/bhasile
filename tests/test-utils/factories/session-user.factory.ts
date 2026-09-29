import { AccessRole, UserType } from "@/generated/prisma/client";
import { SessionGrant, SessionUser } from "@/types/global";

export const createSessionGrant = (
  overrides: Partial<SessionGrant> = {}
): SessionGrant => ({
  role: AccessRole.EDITEUR,
  isNational: false,
  departementNumeros: [],
  structureIds: [],
  operateurId: null,
  ...overrides,
});

export const createSessionUser = (
  overrides: Partial<SessionUser> = {}
): SessionUser => ({
  id: "agent",
  name: "Agent",
  prenom: "Agent",
  email: "agent@gouv.fr",
  type: UserType.AGENT,
  isSuperAdmin: false,
  grants: [],
  ...overrides,
});

export const createNationalAgent = (): SessionUser =>
  createSessionUser({ grants: [createSessionGrant({ isNational: true })] });

export const createDepartementalAgent = (
  departementNumeros: string[]
): SessionUser =>
  createSessionUser({
    grants: [
      createSessionGrant({ role: AccessRole.VIEWER, isNational: true }),
      createSessionGrant({ departementNumeros }),
    ],
  });
