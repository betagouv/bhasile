import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma, PublicType, StructureType } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { StructureColumn } from "@/types/ListColumn";

const typesPublic: Record<string, PublicType> = {
  "tout public": PublicType.TOUT_PUBLIC,
  famille: PublicType.FAMILLE,
  "personnes isolées": PublicType.PERSONNES_ISOLEES,
};

export const convertToPublicType = (
  typePublic: string | null | undefined
): PublicType | undefined => {
  if (!typePublic) {
    return undefined;
  }

  return typesPublic[typePublic.trim().toLowerCase()];
};

export const convertToStructureType = (
  structureType: string
): StructureType => {
  const typesStructures: Record<string, StructureType> = {
    CADA: StructureType.CADA,
    HUDA: StructureType.HUDA,
    CPH: StructureType.CPH,
    CAES: StructureType.CAES,
    PRAHDA: StructureType.PRAHDA,
  };
  return typesStructures[structureType.trim()];
};

type StructureQueryFilters = {
  search: string | null;
  type: string | null;
  bati: string | null;
  placesAutorisees: string | null;
  departements: string | null;
  operateurs: string | null;
  selection?: boolean;
};

export type StructureOrderSearchProps = {
  search: string | null;
  page: number | null;
  type: string | null;
  bati: string | null;
  placesAutorisees: string | null;
  departements: string | null;
  operateurs: string | null;
  column?: StructureColumn | null;
  direction?: "asc" | "desc" | null;
  map?: boolean;
  selection?: boolean;
};

export const STRUCTURES_ORDER_CTE_SQL = Prisma.sql`
  WITH dernier_millesime_structure_typologie AS (
    SELECT DISTINCT ON (st."structureId")
      st."structureId",
      st."placesAutorisees"
    FROM public."StructureTypologie" st
    ORDER BY st."structureId", st."year" DESC
  ),
  structure_repartition AS (
    SELECT
      a."structureId",
      CASE
        WHEN BOOL_AND(a.repartition = 'COLLECTIF'::public."Repartition") THEN 'COLLECTIF'
        WHEN BOOL_AND(a.repartition = 'DIFFUS'::public."Repartition") THEN 'DIFFUS'
        ELSE 'MIXTE'
      END AS bati
    FROM public."Adresse" a
    WHERE a.repartition IS NOT NULL
    GROUP BY a."structureId"
  )
`;

export const STRUCTURES_ORDER_JOINS_SQL = Prisma.sql`
  FROM public."Structure" s
  LEFT JOIN public."Operateur" o ON o.id = s."operateurId"
  LEFT JOIN dernier_millesime_structure_typologie st ON st."structureId" = s.id
  LEFT JOIN structure_repartition sr ON sr."structureId" = s.id
`;

export function buildStructuresOrderSql(
  column: StructureColumn,
  direction: "asc" | "desc"
): Prisma.Sql {
  const dir = direction === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;
  const byColumn: Record<StructureColumn, Prisma.Sql> = {
    codeBhasile: Prisma.sql`s."codeBhasile"`,
    type: Prisma.sql`s."type"`,
    operateur: Prisma.sql`o."name"`,
    departementAdministratif: Prisma.sql`s."departementAdministratif"`,
    bati: Prisma.sql`sr.bati`,
    communes: Prisma.sql`s."communeAdministrative"`,
    placesAutorisees: Prisma.sql`st."placesAutorisees"`,
    finConvention: Prisma.sql`s."finConvention"`,
  };
  return Prisma.sql`${byColumn[column]} ${dir}, s."codeBhasile" ASC`;
}

export function buildStructuresWhereSql({
  search,
  type,
  bati,
  departements,
  placesAutorisees,
  operateurs,
  selection,
}: StructureQueryFilters): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  const typeList = type?.split(",").filter(Boolean) ?? [];
  const depList = departements?.split(",").filter(Boolean) ?? [];
  const opList = operateurs?.split(",").filter(Boolean) ?? [];

  if (!selection) {
    conditions.push(
      Prisma.sql`EXISTS (SELECT 1 FROM public."Form" f WHERE f."structureId" = s.id)`
    );
  }
  if (typeList.length > 0) {
    conditions.push(Prisma.sql`s."type"::text IN (${Prisma.join(typeList)})`);
  }
  if (depList.length > 0) {
    conditions.push(
      Prisma.sql`s."departementAdministratif" IN (${Prisma.join(depList)})`
    );
  }
  if (opList.length > 0) {
    conditions.push(Prisma.sql`o."name" IN (${Prisma.join(opList)})`);
  }
  if (placesAutorisees) {
    const [minStr, maxStr] = placesAutorisees.split(",");
    const min = minStr ? parseInt(minStr, 10) : null;
    const max = maxStr ? parseInt(maxStr, 10) : null;
    if (min !== null && max !== null) {
      conditions.push(
        Prisma.sql`st."placesAutorisees" >= ${min} AND st."placesAutorisees" <= ${max}`
      );
    }
  }
  if (search) {
    const like = `%${search}%`;
    conditions.push(Prisma.sql`(
      s."codeBhasile" ILIKE ${like}
      OR COALESCE(s."finessCode", '') ILIKE ${like}
      OR COALESCE(s."nom", '') ILIKE ${like}
      OR s."departementAdministratif" ILIKE ${like}
      OR s."communeAdministrative" ILIKE ${like}
      OR s."codePostalAdministratif" ILIKE ${like}
      OR COALESCE(o."name", '') ILIKE ${like}
    )`);
  }
  if (bati) {
    if (bati === "none") {
      conditions.push(Prisma.sql`sr.bati IS NULL`);
    } else {
      const batiList = bati.split(",").filter(Boolean);
      if (batiList.length > 0) {
        conditions.push(Prisma.sql`sr.bati IN (${Prisma.join(batiList)})`);
      }
    }
  }

  if (conditions.length === 0) {
    return Prisma.sql``;
  }
  let combined = conditions[0];
  for (let i = 1; i < conditions.length; i += 1) {
    combined = Prisma.sql`${combined} AND ${conditions[i]}`;
  }
  return Prisma.sql`WHERE ${combined}`;
}

export async function getOrderedStructures({
  search,
  page,
  type,
  bati,
  placesAutorisees,
  departements,
  operateurs,
  column,
  direction,
  selection,
  map,
}: StructureOrderSearchProps): Promise<{ id: number }[]> {
  const whereSql = buildStructuresWhereSql({
    search,
    type,
    bati,
    placesAutorisees,
    departements,
    operateurs,
    selection,
  });
  const orderSql = buildStructuresOrderSql(
    column ?? "departementAdministratif",
    direction ?? "asc"
  );
  const paginationSql =
    selection || map
      ? Prisma.sql``
      : Prisma.sql`LIMIT ${DEFAULT_PAGE_SIZE} OFFSET ${(page ?? 0) * DEFAULT_PAGE_SIZE}`;

  return prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
    ${STRUCTURES_ORDER_CTE_SQL}
    SELECT s.id
    ${STRUCTURES_ORDER_JOINS_SQL}
    ${whereSql}
    ORDER BY ${orderSql}
    ${paginationSql}
  `);
}

export async function countStructuresBySearch({
  search,
  type,
  bati,
  placesAutorisees,
  departements,
  operateurs,
}: Pick<
  StructureOrderSearchProps,
  "search" | "type" | "bati" | "placesAutorisees" | "departements" | "operateurs"
>): Promise<number> {
  const whereSql = buildStructuresWhereSql({
    search,
    type,
    bati,
    departements,
    placesAutorisees,
    operateurs,
    selection: false,
  });
  const result = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    ${STRUCTURES_ORDER_CTE_SQL}
    SELECT COUNT(*)::bigint AS count
    ${STRUCTURES_ORDER_JOINS_SQL}
    ${whereSql}
  `);
  return Number(result[0]?.count ?? 0);
}
