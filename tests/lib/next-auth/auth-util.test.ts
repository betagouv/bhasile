import type { Session } from "next-auth";
import {
  createGrantDb,
  createUserWithGrants,
} from "tests/test-utils/factories/user-with-grants.factory";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AccessRole, GrantScope } from "@/generated/prisma/enums";
import { getPermissionsFromSession } from "@/lib/next-auth/auth-util";

const mockGetUserWithGrantsByEmail = vi.fn();
const mockGetContactStructureIds = vi.fn();

vi.mock("@/app/api/users/user.repository", () => ({
  getUserWithGrantsByEmail: (...args: unknown[]) =>
    mockGetUserWithGrantsByEmail(...args),
}));

vi.mock("@/app/api/contacts/contact.service", () => ({
  getContactStructureIds: (...args: unknown[]) =>
    mockGetContactStructureIds(...args),
}));

const session = {
  user: { email: "agent@finistere.gouv.fr" },
} as Session;

const contactGrant = {
  role: AccessRole.LECTEUR,
  isNational: false,
  departementNumeros: [],
  regionIds: [],
  structureIds: [12],
};

describe("getPermissionsFromSession", () => {
  beforeEach(() => {
    vi.stubEnv("CONTACT_ACCESS_ENABLED", "true");
    mockGetContactStructureIds.mockResolvedValue([12]);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("donne à un agent activé la lecture nationale et l'admin sur son périmètre, sans droits de contact", async () => {
    mockGetUserWithGrantsByEmail.mockResolvedValue(createUserWithGrants());

    const permissions = await getPermissionsFromSession(session);

    expect(permissions).toEqual({
      operateurId: null,
      isSuperAdmin: false,
      isAgent: true,
      grants: [
        {
          role: AccessRole.LECTEUR,
          isNational: true,
          departementNumeros: [],
          regionIds: [],
          structureIds: [],
        },
        {
          role: AccessRole.ADMIN,
          isNational: false,
          departementNumeros: ["29"],
          regionIds: [53],
          structureIds: [],
        },
      ],
    });
  });

  it("ne donne que les droits de contact à un compte en attente, même rattaché à un périmètre", async () => {
    mockGetUserWithGrantsByEmail.mockResolvedValue(
      createUserWithGrants({ isActivated: false })
    );

    const permissions = await getPermissionsFromSession(session);

    expect(permissions.isAgent).toBe(false);
    expect(permissions.grants).toEqual([contactGrant]);
  });

  it("ne donne rien à un compte désactivé, droits de contact compris", async () => {
    mockGetUserWithGrantsByEmail.mockResolvedValue(
      createUserWithGrants({
        isActivated: false,
        deactivatedAt: new Date(),
        isSuperAdmin: true,
      })
    );

    const permissions = await getPermissionsFromSession(session);

    expect(permissions).toMatchObject({
      isSuperAdmin: false,
      isAgent: false,
      grants: [],
    });
    expect(mockGetContactStructureIds).not.toHaveBeenCalled();
  });

  it("reconnaît un superadmin activé", async () => {
    mockGetUserWithGrantsByEmail.mockResolvedValue(
      createUserWithGrants({ isSuperAdmin: true, perimeter: null })
    );

    const permissions = await getPermissionsFromSession(session);

    expect(permissions).toMatchObject({ isSuperAdmin: true, isAgent: true });
  });

  it("donne à un opérateur activé ses binômes et ses droits de contact", async () => {
    mockGetUserWithGrantsByEmail.mockResolvedValue(
      createUserWithGrants({
        operateurId: 3,
        perimeter: null,
        grants: [
          createGrantDb({
            scope: GrantScope.STRUCTURE,
            structure: { id: 7, codeBhasile: "C7" },
          }),
        ],
      })
    );

    const permissions = await getPermissionsFromSession(session);

    expect(permissions.isAgent).toBe(false);
    expect(permissions.grants.map(({ structureIds }) => structureIds)).toEqual([
      [7],
      [12],
    ]);
  });

  it("ne donne rien à un email inconnu en base", async () => {
    mockGetUserWithGrantsByEmail.mockResolvedValue(null);

    const permissions = await getPermissionsFromSession(session);

    expect(permissions).toEqual({
      operateurId: null,
      isSuperAdmin: false,
      isAgent: false,
      grants: [],
    });
  });
});
