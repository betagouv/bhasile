import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

type RoleWithDepartements = Prisma.RoleGetPayload<{
  include: { roleDepartements: { include: { departement: true } } };
}>;

export const getAnonymousRole = async (): Promise<RoleWithDepartements> => {
  return prisma.role.findFirstOrThrow({
    where: {
      name: "ANONYMOUS",
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
