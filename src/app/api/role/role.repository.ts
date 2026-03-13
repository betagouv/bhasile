import { Prisma, RoleGroup } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

type RoleWithDepartements = Prisma.RoleGetPayload<{
  include: { roleDepartements: { include: { departement: true } } };
}>;

export const getRolePatterns = async (): Promise<
  { emailPattern: string | null }[]
> => {
  return prisma.role.findMany({
    select: { emailPattern: true },
  });
};

export const getAllRoles = async (): Promise<RoleWithDepartements[]> => {
  return prisma.role.findMany({
    include: {
      roleDepartements: {
        include: {
          departement: true,
        },
      },
    },
  });
};

export const getAnonymousRole = async (): Promise<RoleWithDepartements> => {
  return prisma.role.findFirstOrThrow({
    where: {
      group: RoleGroup.ANONYMOUS,
    },
    include: {
      roleDepartements: {
        include: {
          departement: true,
        },
      },
    },
  });
};
