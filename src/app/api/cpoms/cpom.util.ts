import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { CpomColumn } from "@/types/ListColumn";

type CpomQueryFilters = {
  departements: string | null;
};

export type CpomOrderSearchProps = {
  page?: number | null;
  departements: string | null;
  column?: CpomColumn | null;
  direction?: "asc" | "desc" | null;
};

export const CPOM_ORDER_CTE_SQL = Prisma.sql`
  WITH
    cpom_start_dates AS (
      SELECT DISTINCT ON (aa."cpomId")
        aa."cpomId",
        aa."startDate" AS "dateStart"
      FROM public."ActeAdministratif" aa
      WHERE aa."cpomId" IS NOT NULL AND aa."startDate" IS NOT NULL
      ORDER BY aa."cpomId", aa.id ASC
    ),
    cpom_end_dates AS (
      SELECT
        aa."cpomId",
        MAX(aa."endDate") AS "dateEnd"
      FROM public."ActeAdministratif" aa
      WHERE aa."cpomId" IS NOT NULL AND aa."endDate" IS NOT NULL
      GROUP BY aa."cpomId"
    ),
    cpom_departements AS (
      SELECT
        cd."cpomId",
        STRING_AGG(d.numero, ', ' ORDER BY d.numero) AS departements
      FROM public."CpomDepartement" cd
      JOIN public."Departement" d ON d.id = cd."departementId"
      GROUP BY cd."cpomId"
    ),
    cpom_structures AS (
      SELECT
        cs."cpomId",
        COUNT(*)::int AS structures
      FROM public."CpomStructure" cs
      GROUP BY cs."cpomId"
    )
`;

export const CPOM_ORDER_JOINS_SQL = Prisma.sql`
  FROM public."Cpom" c
  LEFT JOIN public."Operateur" o ON o.id = c."operateurId"
  LEFT JOIN public."Region" r ON r.id = c."regionId"
  LEFT JOIN cpom_start_dates sd ON sd."cpomId" = c.id
  LEFT JOIN cpom_end_dates ed ON ed."cpomId" = c.id
  LEFT JOIN cpom_departements cd ON cd."cpomId" = c.id
  LEFT JOIN cpom_structures cs ON cs."cpomId" = c.id
`;

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

export function buildCpomsWhereSql({ departements }: CpomQueryFilters): Prisma.Sql {
  const departementList = departements?.split(",").filter(Boolean) ?? [];
  if (departementList.length === 0) {
    return Prisma.sql``;
  }
  const patterns = departementList.map((departement) => `%${departement}%`);
  return Prisma.sql`WHERE COALESCE(cd.departements, '') ILIKE ANY (ARRAY[${Prisma.join(patterns)}])`;
}

export async function getOrderedCpoms({
  page,
  departements,
  column,
  direction,
}: CpomOrderSearchProps): Promise<{ id: number }[]> {
  const whereSql = buildCpomsWhereSql({ departements });
  const orderSql = buildCpomsOrderSql(column ?? "region", direction ?? "asc");
  return prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    ${CPOM_ORDER_CTE_SQL}
    SELECT c.id
    ${CPOM_ORDER_JOINS_SQL}
    ${whereSql}
    ORDER BY ${orderSql}
    LIMIT ${DEFAULT_PAGE_SIZE}
    OFFSET ${(page ?? 0) * DEFAULT_PAGE_SIZE}
  `);
}

export async function countCpomsBySearch({
  departements,
}: Pick<CpomOrderSearchProps, "departements">): Promise<number> {
  const whereSql = buildCpomsWhereSql({ departements });
  const result = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    ${CPOM_ORDER_CTE_SQL}
    SELECT COUNT(*)::bigint AS count
    ${CPOM_ORDER_JOINS_SQL}
    ${whereSql}
  `);
  return Number(result[0]?.count ?? 0);
}
