import { Prisma } from "@/generated/prisma/client";

export type StructureVersionDbDetails = Prisma.StructureVersionGetPayload<{
  include: {
    structure: true;
    contacts: true;
    adresses: true;
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
