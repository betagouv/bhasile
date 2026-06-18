import { Prisma, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { StatistiquesFiltersRaw } from "@/schemas/api/statistique.schema";

export const buildStructureWhere = async (
  filters: StatistiquesFiltersRaw
): Promise<Prisma.StructureWhereInput> => {
  // TODO(structure-version): filtrer type/département sur version effective (shared/utils)
  const where: Prisma.StructureWhereInput = {};

  const typeList = filters.types?.split(",").filter(Boolean) ?? [];
  if (typeList.length > 0) {
    where.type = { in: typeList as StructureType[] };
  }

  const depList = filters.departements?.split(",").filter(Boolean) ?? [];
  if (depList.length > 0) {
    where.departementAdministratif = { in: depList };
  }

  const opIds =
    filters.operateurs?.split(",").filter(Boolean).map(Number) ?? [];
  if (opIds.length > 0) {
    const filiales = await prisma.operateur.findMany({
      where: { parentId: { in: opIds } },
      select: { id: true },
    });
    const allOpIds = [
      ...new Set([...opIds, ...filiales.map((filiale) => filiale.id)]),
    ];
    where.operateurId = { in: allOpIds };
  }

  return where;
};
