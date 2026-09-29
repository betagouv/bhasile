import { Prisma } from "@/generated/prisma/client";

export const grantPerimetreSelect = {
  name: true,
  isNational: true,
  operateurId: true,
  regions: {
    select: {
      region: { select: { departements: { select: { numero: true } } } },
    },
  },
  departements: { select: { departementNumero: true } },
  structures: { select: { structureId: true } },
} satisfies Prisma.PerimetreSelect;

export const grantSelect = {
  role: true,
  perimetre: { select: grantPerimetreSelect },
} satisfies Prisma.UserGrantSelect;

export const userWithGrantsSelect = {
  type: true,
  isSuperAdmin: true,
  grants: { select: grantSelect },
  emailPattern: { select: { grants: { select: grantSelect } } },
} satisfies Prisma.UserSelect;

export type GrantWithPerimetre = Prisma.UserGrantGetPayload<{
  select: typeof grantSelect;
}>;

export type UserWithGrants = Prisma.UserGetPayload<{
  select: typeof userWithGrantsSelect;
}>;
