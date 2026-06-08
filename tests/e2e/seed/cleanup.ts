import { prisma } from "./prisma";

export const deleteStructureByCode = async (
  codeBhasile: string
): Promise<void> => {
  await prisma.$transaction([
    prisma.userAction.deleteMany({ where: { structure: { codeBhasile } } }),
    prisma.cpomStructure.deleteMany({ where: { structure: { codeBhasile } } }),
    prisma.structure.deleteMany({ where: { codeBhasile } }),
  ]);
};

export const deleteCpomById = async (id: number): Promise<void> => {
  await prisma.$transaction([
    prisma.userAction.deleteMany({ where: { cpomId: id } }),
    prisma.cpomMillesime.deleteMany({ where: { cpomId: id } }),
    prisma.cpom.deleteMany({ where: { id } }),
  ]);
};
