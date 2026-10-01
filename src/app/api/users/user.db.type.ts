import { Prisma } from "@/generated/prisma/client";

export const grantSelect = {
  role: true,
  scope: true,
  region: {
    select: { name: true, departements: { select: { numero: true } } },
  },
  departement: { select: { numero: true, name: true } },
  structure: { select: { id: true, codeBhasile: true } },
  operateurId: true,
} satisfies Prisma.UserGrantSelect;

export const userWithGrantsSelect = {
  type: true,
  isSuperAdmin: true,
  grants: { select: grantSelect },
  emailPattern: { select: { grants: { select: grantSelect } } },
} satisfies Prisma.UserSelect;

export type GrantDb = Prisma.UserGrantGetPayload<{
  select: typeof grantSelect;
}>;

export type UserWithGrants = Prisma.UserGetPayload<{
  select: typeof userWithGrantsSelect;
}>;
