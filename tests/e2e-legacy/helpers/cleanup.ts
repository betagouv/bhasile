import { prisma } from "../../e2e/seed/prisma";

export const deleteStructure = async (codeBhasile: string): Promise<void> => {
  await prisma.$transaction([
    prisma.cpomStructure.deleteMany({ where: { structure: { codeBhasile } } }),
    prisma.note.deleteMany({ where: { structure: { codeBhasile } } }),
    prisma.structure.deleteMany({ where: { codeBhasile } }),
  ]);
};

export const deleteCpom = async (id: number): Promise<void> => {
  await prisma.cpom.deleteMany({ where: { id } });
};
