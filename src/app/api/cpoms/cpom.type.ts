import { Prisma } from "@/generated/prisma/client";

export type CpomWithRelations = Prisma.CpomGetPayload<{
  include: {
    structures: true;
    cpomMillesimes: true;
    operateur: true;
    actesAdministratifs: true;
  };
}>;
