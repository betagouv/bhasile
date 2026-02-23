import { Prisma } from "@/generated/prisma/client";

export type StructureWithRelations = Prisma.StructureGetPayload<{
  include: {
    controles: true;
    evaluations: true;
    evenementsIndesirablesGraves: true;
    adresses: {
      include: {
        adresseTypologies: true;
      };
    };
    contacts: true;
    structureTypologies: true;
    activites: true;
    fileUploads: true;
    cpomStructures: {
      include: {
        cpom: {
          include: {
            structures: true;
            cpomMillesimes: true;
            operateur: true;
            actesAdministratifs: true;
          };
        };
      };
    };
    structureMillesimes: true;
    budgets: true;
    operateur: true;
    forms: true;
  };
}>;
