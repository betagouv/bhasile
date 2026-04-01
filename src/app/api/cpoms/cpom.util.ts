import { Prisma } from "@/generated/prisma/client";
import { CpomColumn } from "@/types/ListColumn";

type CpomQueryFilters = {
  departements: string | null;
};

export function buildCpomsOrderSql(
  column: CpomColumn,
  direction: "asc" | "desc"
): Prisma.Sql {
  const dir = direction === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  const byColumn: Record<CpomColumn, Prisma.Sql> = {
    operateur: Prisma.sql`o.name`,
    structures: Prisma.sql`COALESCE(cs.structures, 0)`,
    granularity: Prisma.sql`c.granularity`,
    region: Prisma.sql`r.name`,
    departements: Prisma.sql`COALESCE(cd.departements, '')`,
    dateStart: Prisma.sql`sd."dateStart"`,
    dateEnd: Prisma.sql`ed."dateEnd"`,
  };
  return Prisma.sql`${byColumn[column]} ${dir}, c.id ASC`;
}

export function buildCpomsWhereSql({
  departements,
}: CpomQueryFilters): Prisma.Sql {
  const departementList = departements?.split(",").filter(Boolean) ?? [];
  if (departementList.length === 0) {
    return Prisma.sql``;
  }
  const patterns = departementList.map((departement) => `%${departement}%`);
  return Prisma.sql`WHERE COALESCE(cd.departements, '') ILIKE ANY (ARRAY[${Prisma.join(patterns)}])`;
}
