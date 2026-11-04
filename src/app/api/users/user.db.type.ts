import { Prisma } from "@/generated/prisma/client";

export const grantSelect = {
  role: true,
  scope: true,
  region: {
    select: {
      id: true,
      name: true,
      departements: { select: { numero: true } },
    },
  },
  departement: { select: { numero: true, name: true, regionId: true } },
  structure: { select: { id: true, codeBhasile: true } },
} satisfies Prisma.GrantSelect;

export const perimeterSelect = {
  name: true,
  scope: true,
  region: grantSelect.region,
  departement: grantSelect.departement,
} satisfies Prisma.PerimeterSelect;

export const userWithGrantsSelect = {
  id: true,
  operateurId: true,
  isSuperAdmin: true,
  isActivated: true,
  deactivatedAt: true,
  grants: { select: grantSelect },
  perimeter: { select: perimeterSelect },
} satisfies Prisma.UserSelect;

export type GrantDb = Prisma.GrantGetPayload<{
  select: typeof grantSelect;
}>;

export type PerimeterDb = Prisma.PerimeterGetPayload<{
  select: typeof perimeterSelect;
}>;

export type UserWithGrants = Prisma.UserGetPayload<{
  select: typeof userWithGrantsSelect;
}>;
