import { Prisma } from "@/generated/prisma/client";

export type StructureVersionDbDetails = Prisma.StructureVersionGetPayload<{
  include: {
    structure: {
      include: {
        operateur: { select: { id: true; name: true } };
      };
    };
    contacts: true;
    adresses: {
      include: {
        adresseTypologies: {
          orderBy: {
            year: "desc";
          };
        };
      };
    };
    finesses: true;
    antennes: true;
    dnaStructures: {
      include: { dna: true };
    };
    structureTypologies: {
      orderBy: { year: "desc" };
    };
  };
}>;
