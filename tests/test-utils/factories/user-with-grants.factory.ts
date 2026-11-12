import type {
  GrantDb,
  PerimeterDb,
  UserWithGrants,
} from "@/app/api/users/user.db.type";
import { AccessRole, GrantScope } from "@/generated/prisma/enums";

export const createGrantDb = (overrides: Partial<GrantDb> = {}): GrantDb => ({
  role: AccessRole.EDITEUR,
  scope: GrantScope.NATIONAL,
  region: null,
  departement: null,
  structure: null,
  ...overrides,
});

export const createDepartementPerimeter = (
  numero: string,
  name: string
): PerimeterDb => ({
  name: `DDETS ${name}`,
  grants: [
    createGrantDb({
      role: AccessRole.ADMIN,
      scope: GrantScope.DEPARTEMENT,
      departement: { numero, name, regionId: 53 },
    }),
  ],
});

export const createRegionPerimeter = (
  region: NonNullable<GrantDb["region"]> = {
    id: 53,
    name: "Bretagne",
    departements: [{ numero: "22" }, { numero: "29" }, { numero: "35" }],
  }
): PerimeterDb => ({
  name: `DREETS ${region.name}`,
  grants: [
    createGrantDb({
      role: AccessRole.ADMIN,
      scope: GrantScope.REGION,
      region,
    }),
  ],
});

export const createNationalPerimeter = (): PerimeterDb => ({
  name: "Administration centrale",
  grants: [],
});

export const createUserWithGrants = (
  overrides: Partial<UserWithGrants> = {}
): UserWithGrants => ({
  id: 1,
  operateurId: null,
  isSuperAdmin: false,
  isActivated: true,
  deactivatedAt: null,
  grants: [],
  perimeter: createDepartementPerimeter("29", "Finistère"),
  ...overrides,
});
