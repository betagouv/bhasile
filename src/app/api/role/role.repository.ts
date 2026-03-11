import { Role, RoleGroup } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

export const getRolePatterns = async (): Promise<
  { emailPattern: string | null }[]
> => {
  return prisma.role.findMany({
    select: { emailPattern: true },
  });
};

export const getAllRoles = async (): Promise<Role[]> => {
  return prisma.role.findMany();
};

export const getAnonymousRole = async (): Promise<Role> => {
  return prisma.role.findFirstOrThrow({
    where: {
      group: RoleGroup.ANONYMOUS,
    },
  });
};
