import { Prisma } from "@/generated/prisma/client";

export type OperateurDbDetail = Prisma.OperateurGetPayload<{
  include: {
    contacts: true;
    actesAdministratifs: {
      include: { fileUploads: true };
    };
  };
}>;
