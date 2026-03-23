import { Prisma } from "@/generated/prisma/client";
import { CpomColumn } from "@/types/ListColumn";

export const getCpomSearchWhere = ({
  departements,
}: {
  departements: string | null;
}): Prisma.CpomOrderWhereInput => {
  const where: Prisma.CpomOrderWhereInput = {};

  if (departements) {
    const departementList = departements.split(",").filter(Boolean);
    if (departementList.length > 0) {
      where.OR = departementList.map((departement) => ({
        departements: {
          contains: departement,
          mode: "insensitive",
        },
      }));
    }
  }

  return where;
};

export const getCpomOrderBy = (
  column: CpomColumn,
  direction: "asc" | "desc"
): Prisma.CpomOrderOrderByWithRelationInput[] => {
  return [{ [column]: direction }, { id: "asc" }];
};
