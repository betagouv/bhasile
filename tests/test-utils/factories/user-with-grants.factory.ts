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
  name: string,
  overrides: Partial<PerimeterDb> = {}
): PerimeterDb => ({
  name: `DDETS ${name}`,
  scope: GrantScope.DEPARTEMENT,
  region: null,
  departement: { numero, name, regionId: 53 },
  ...overrides,
});

export const createRegionPerimeter = (
  overrides: Partial<PerimeterDb> = {}
): PerimeterDb => ({
  name: "DREETS Bretagne",
  scope: GrantScope.REGION,
  region: {
    id: 53,
    name: "Bretagne",
    departements: [{ numero: "22" }, { numero: "29" }, { numero: "35" }],
  },
  departement: null,
  ...overrides,
});

export const createNationalPerimeter = (): PerimeterDb => ({
  name: "Administration centrale",
  scope: GrantScope.NATIONAL,
  region: null,
  departement: null,
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
