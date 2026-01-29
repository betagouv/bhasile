import prisma from "@/lib/prisma";
import { StructureType } from "@/types/structure.type";

export const createMinimalStructure = async (
  structure: MinimalStructure
): Promise<void> => {
  await prisma.structure.upsert({
    where: { dnaCode: structure.dnaCode },
    update: structure,
    create: structure,
  });
};

type MinimalStructure = {
  dnaCode: string;
  type: StructureType;
  operateurId: number;
  departementAdministratif: string;
  nom: string;
  adresseAdministrative: string;
  codePostalAdministratif: string;
  communeAdministrative: string;
};

export const deleteStructure = async (dnaCode: string): Promise<void> => {
  await prisma.structure.delete({ where: { dnaCode } });
};
