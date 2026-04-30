import { Prisma } from "@/generated/prisma/client";

export type CpomDbList = Prisma.CpomGetPayload<{
  include: {
    structures: true;
    budgets: true;
    operateur: true;
    region: true;
    departements: {
      include: {
        departement: true;
      };
    };
    actesAdministratifs: {
      include: {
        fileUploads: true;
      };
    };
  };
}>;

export type CpomDbDetails = Prisma.CpomGetPayload<{
  include: {
    structures: {
      include: {
        structure: {
          select: {
            id: true;
            codeBhasile: true;
            type: true;
            communeAdministrative: true;
            operateur: {
              select: {
                name: true;
              };
            };
            forms: true;
          };
        };
      };
    };
    budgets: true;
    operateur: true;
    region: true;
    departements: {
      include: {
        departement: true;
      };
    };
    actesAdministratifs: {
      include: {
        fileUploads: true;
      };
    };
  };
}>;
