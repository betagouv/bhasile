-- Objective: enable CPOM ordering/filtering in front-end
-- This view is in public to prevent interruption in the application if the reporting schema is not created yet
DROP VIEW IF EXISTS "public"."cpoms_order";

CREATE VIEW "public"."cpoms_order" AS
WITH
  cpom_start_dates AS (
    SELECT DISTINCT ON (aa."cpomId")
      aa."cpomId",
      aa."startDate" AS "dateStart"
    FROM public."ActeAdministratif" aa
    WHERE aa."cpomId" IS NOT NULL
      AND aa."startDate" IS NOT NULL
    ORDER BY aa."cpomId", aa.id ASC
  ),
  cpom_end_dates AS (
    SELECT
      aa."cpomId",
      MAX(aa."endDate") AS "dateEnd"
    FROM public."ActeAdministratif" aa
    WHERE aa."cpomId" IS NOT NULL
      AND aa."endDate" IS NOT NULL
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
SELECT
  c.id,
  o.name AS operateur,
  COALESCE(cs.structures, 0) AS structures,
  c.granularity::text AS granularity,
  r.name AS region,
  COALESCE(cd.departements, '') AS departements,
  sd."dateStart",
  ed."dateEnd"
FROM public."Cpom" c
LEFT JOIN public."Operateur" o ON o.id = c."operateurId"
LEFT JOIN public."Region" r ON r.id = c."regionId"
LEFT JOIN cpom_start_dates sd ON sd."cpomId" = c.id
LEFT JOIN cpom_end_dates ed ON ed."cpomId" = c.id
LEFT JOIN cpom_departements cd ON cd."cpomId" = c.id
LEFT JOIN cpom_structures cs ON cs."cpomId" = c.id;