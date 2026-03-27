import { Prisma } from "@/generated/prisma/client";

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
