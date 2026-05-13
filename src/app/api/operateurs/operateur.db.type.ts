import { Prisma } from "@/generated/prisma/client";

export type OperateurDbDetail = Prisma.OperateurGetPayload<{
  include: {
    actesAdministratifs: {
      include: {
        fileUploads: true;
      };
    };
    documentsFinanciers: {
      include: {
        fileUploads: true;
      };
    };
  };
}>;
