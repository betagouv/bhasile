import { Prisma } from "@/generated/prisma/client";

export type StructureVersionDb = Prisma.StructureVersionGetPayload<{
  include: {
    structure: { include: { operateur: true } };
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
