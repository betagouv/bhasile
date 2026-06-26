import { startOfNextUtcDay } from "@/app/utils/date.util";
import { DEFAULT_PAGE_SIZE } from "@/constants";
import { Prisma } from "@/generated/prisma/client";
import { StructureColumn } from "@/types/ListColumn";

import { FINALISATION_FORM_SLUG } from "../forms/form.constants";
import type { SearchProps } from "./structure.service";

const buildBornFromCreationSql = (now: Date): Prisma.Sql => Prisma.sql`
  EXISTS (
    SELECT 1
    FROM public."StructureVersion" sv_creation
    JOIN public."StructureVersionTransformation" svt_creation
      ON svt_creation.id = sv_creation."structureVersionTransformationId"
    JOIN public."Form" f_creation
      ON f_creation."transformationId" = svt_creation."transformationId"
    WHERE sv_creation."structureId" = s.id
      AND svt_creation."type" = 'CREATION'::public."StructureVersionTransformationType"
      AND sv_creation."effectiveDate" < ${startOfNextUtcDay(now).toISOString()}::timestamptz AT TIME ZONE 'UTC'
      AND f_creation."status" IS TRUE
  )
`;

const buildCurrentVersionCteSql = (now: Date): Prisma.Sql => Prisma.sql`
  current_version AS (
    SELECT DISTINCT ON (sv."structureId")
      sv."structureId",
      sv.id AS version_id
    FROM public."StructureVersion" sv
    LEFT JOIN public."StructureVersionTransformation" svt ON svt.id = sv."structureVersionTransformationId"
    LEFT JOIN public."Form" f ON f."transformationId" = svt."transformationId"
    WHERE sv."structureId" IS NOT NULL
      AND sv."effectiveDate" < ${startOfNextUtcDay(now).toISOString()}::timestamptz AT TIME ZONE 'UTC'
      AND (sv."structureVersionTransformationId" IS NULL OR f."status" IS TRUE)
    ORDER BY sv."structureId", sv."effectiveDate" DESC, sv.id DESC
  )
`;

const buildStructuresOrderCteSql = (now: Date): Prisma.Sql => Prisma.sql`
  WITH ${buildCurrentVersionCteSql(now)},
  dernier_millesime_structure_typologie AS (
    SELECT DISTINCT ON (cv."structureId")
      cv."structureId",
      st."placesAutorisees"
    FROM current_version cv
    JOIN public."StructureTypologie" st ON st."structureVersionId" = cv.version_id
    ORDER BY cv."structureId", st."year" DESC
  ),
  structure_repartition AS (
    SELECT
      cv."structureId",
      CASE
        WHEN BOOL_AND(a.repartition = 'COLLECTIF'::public."Repartition") THEN 'COLLECTIF'
        WHEN BOOL_AND(a.repartition = 'DIFFUS'::public."Repartition") THEN 'DIFFUS'
        ELSE 'MIXTE'
      END AS bati
    FROM current_version cv
    JOIN public."Adresse" a ON a."structureVersionId" = cv.version_id
    WHERE a.repartition IS NOT NULL
    GROUP BY cv."structureId"
  )
`;

const STRUCTURES_ORDER_JOINS_SQL = Prisma.sql`
  FROM public."Structure" s
  JOIN current_version cv ON cv."structureId" = s.id
  JOIN public."StructureVersion" sv ON sv.id = cv.version_id
  LEFT JOIN public."Operateur" o ON o.id = s."operateurId"
  LEFT JOIN dernier_millesime_structure_typologie st ON st."structureId" = s.id
  LEFT JOIN structure_repartition sr ON sr."structureId" = s.id
`;

type StructureQueryFilters = {
  search: string | null;
  type: string | null;
  bati: string | null;
  placesAutorisees: string | null;
  departements: string | null;
  operateurs: string | null;
  selection?: boolean;
  finalised?: boolean;
};

export const buildStructuresOrderSql = (
  column: StructureColumn,
  direction: "asc" | "desc"
): Prisma.Sql => {
  const dir = direction === "desc" ? Prisma.sql`DESC` : Prisma.sql`ASC`;

  const byColumn: Partial<Record<StructureColumn, Prisma.Sql>> = {
    codeBhasile: Prisma.sql`s."codeBhasile"`,
    type: Prisma.sql`sv."type"`,
    operateur: Prisma.sql`o."name"`,
    departementAdministratif: Prisma.sql`sv."departementAdministratif"`,
    bati: Prisma.sql`sr.bati`,
    communes: Prisma.sql`sv."communeAdministrative"`,
    placesAutorisees: Prisma.sql`st."placesAutorisees"`,
    finConvention: Prisma.sql`s."finConvention"`,
  };
  const orderExpression = byColumn[column] ?? Prisma.sql`s."codeBhasile"`;
  return Prisma.sql`${orderExpression} ${dir}, s."codeBhasile" ASC`;
};

export const buildStructuresWhereSql = (
  {
    search,
    type,
    bati,
    departements,
    placesAutorisees,
    operateurs,
    selection,
    finalised,
  }: StructureQueryFilters,
  now: Date
): Prisma.Sql => {
  const conditions: Prisma.Sql[] = [];
  const typeList = type?.split(",").filter(Boolean) ?? [];
  const depList = departements?.split(",").filter(Boolean) ?? [];
  const opList = operateurs?.split(",").filter(Boolean) ?? [];

  if (!selection) {
    conditions.push(
      Prisma.sql`(EXISTS (SELECT 1 FROM public."Form" f WHERE f."structureId" = s.id) OR ${buildBornFromCreationSql(now)})`
    );
  }
  if (finalised) {
    conditions.push(
      Prisma.sql`(EXISTS (
        SELECT 1
        FROM public."Form" f
        JOIN public."FormDefinition" fd ON fd.id = f."formDefinitionId"
        WHERE f."structureId" = s.id
          AND fd."slug" = ${FINALISATION_FORM_SLUG}
          AND f."status" = true
      ) OR ${buildBornFromCreationSql(now)})`
    );
  }
  if (typeList.length > 0) {
    conditions.push(Prisma.sql`sv."type"::text IN (${Prisma.join(typeList)})`);
  }
  if (depList.length > 0) {
    conditions.push(
      Prisma.sql`sv."departementAdministratif" IN (${Prisma.join(depList)})`
    );
  }
  if (opList.length > 0) {
    conditions.push(Prisma.sql`o."name" IN (${Prisma.join(opList)})`);
  }
  if (placesAutorisees) {
    const [minStr, maxStr] = placesAutorisees.split(",");
    const min = minStr ? parseInt(minStr, 10) : null;
    const max = maxStr ? parseInt(maxStr, 10) : null;
    if (
      min !== null &&
      max !== null &&
      !Number.isNaN(min) &&
      !Number.isNaN(max)
    ) {
      conditions.push(
        Prisma.sql`st."placesAutorisees" >= ${min} AND st."placesAutorisees" <= ${max}`
      );
    }
  }

  if (search) {
    const like = `%${search}%`;
    conditions.push(Prisma.sql`(
      s."codeBhasile" ILIKE ${like}
      OR EXISTS (
        SELECT 1
        FROM public."DnaStructure" ds
        JOIN public."Dna" d ON d.id = ds."dnaId"
        WHERE ds."structureVersionId" = sv.id
          AND d.code ILIKE ${like}
      )
      OR EXISTS (
        SELECT 1
        FROM public."StructureFiness" sf
        JOIN public."Finess" f ON f.id = sf."finessId"
        WHERE sf."structureVersionId" = sv.id
          AND COALESCE(f."code", '') ILIKE ${like}
      )
      OR COALESCE(sv."nom", '') ILIKE ${like}
      OR sv."departementAdministratif" ILIKE ${like}
      OR sv."communeAdministrative" ILIKE ${like}
      OR sv."codePostalAdministratif" ILIKE ${like}
      OR COALESCE(o."name", '') ILIKE ${like}
    )`);
  }
  if (bati) {
    const batiList = bati
      .split(",")
      .filter(Boolean)
      .map((value) => value.toUpperCase());
    if (batiList.length > 0) {
      conditions.push(
        Prisma.sql`UPPER(COALESCE(sr.bati, '')) IN (${Prisma.join(batiList)})`
      );
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
};

export const buildOrderedStructureIdsQuery = (
  {
    search,
    page,
    type,
    bati,
    placesAutorisees,
    departements,
    operateurs,
    column,
    direction,
    map,
    selection,
    finalised,
  }: SearchProps,
  now: Date
): Prisma.Sql => {
  const whereSql = buildStructuresWhereSql(
    {
      search,
      type,
      bati,
      placesAutorisees,
      departements,
      operateurs,
      selection,
      finalised,
    },
    now
  );
  const orderSql = buildStructuresOrderSql(
    column ?? "departementAdministratif",
    direction ?? "asc"
  );
  const paginationSql =
    selection || map
      ? Prisma.sql``
      : Prisma.sql`LIMIT ${DEFAULT_PAGE_SIZE} OFFSET ${(page ?? 0) * DEFAULT_PAGE_SIZE}`;

  return Prisma.sql`
    ${buildStructuresOrderCteSql(now)}
    SELECT s.id, ${buildBornFromCreationSql(now)} AS "bornFromCreation"
    ${STRUCTURES_ORDER_JOINS_SQL}
    ${whereSql}
    ORDER BY ${orderSql}
    ${paginationSql}
  `;
};

export const buildCountStructuresQuery = (
  {
    search,
    type,
    bati,
    placesAutorisees,
    departements,
    operateurs,
  }: SearchProps,
  now: Date
): Prisma.Sql => {
  const whereSql = buildStructuresWhereSql(
    {
      search,
      type,
      bati,
      departements,
      placesAutorisees,
      operateurs,
      selection: false,
    },
    now
  );
  return Prisma.sql`
    ${buildStructuresOrderCteSql(now)}
    SELECT COUNT(*)::bigint AS count
    ${STRUCTURES_ORDER_JOINS_SQL}
    ${whereSql}
  `;
};

export const buildLatestPlacesAutoriseesQuery = (now: Date): Prisma.Sql =>
  Prisma.sql`
    WITH ${buildCurrentVersionCteSql(now)}
    SELECT DISTINCT ON (cv."structureId")
      st."placesAutorisees" AS "placesAutorisees"
    FROM current_version cv
    JOIN public."StructureTypologie" st ON st."structureVersionId" = cv.version_id
    WHERE st."placesAutorisees" IS NOT NULL
    ORDER BY cv."structureId", st."year" DESC
  `;
