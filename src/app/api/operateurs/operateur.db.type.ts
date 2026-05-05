import { Prisma } from "@/generated/prisma/client";

export type OperateurDbDetail = Prisma.OperateurGetPayload<{
  include: {
    structures: {
      select: {
        lgbt: true;
        fvvTeh: true;
      };
    };
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
