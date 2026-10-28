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

export const userWithGrantsSelect = {
  id: true,
  operateurId: true,
  isSuperAdmin: true,
  grants: { select: grantSelect },
  emailPattern: { select: { grants: { select: grantSelect } } },
} satisfies Prisma.UserSelect;

export type GrantDb = Prisma.GrantGetPayload<{
  select: typeof grantSelect;
}>;

export type UserWithGrants = Prisma.UserGetPayload<{
  select: typeof userWithGrantsSelect;
}>;
