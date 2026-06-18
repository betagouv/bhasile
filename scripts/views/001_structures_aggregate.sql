-- Objective: per-structure impact inputs (places + budget hors CPOM)
CREATE OR REPLACE VIEW:"SCHEMA"."structures_aggregates" AS
WITH
  structure_typologie_dernier_millesime AS (
    SELECT DISTINCT
      ON (st."structureId") st."structureId",
      st."placesAutorisees"
    FROM
      public."StructureTypologie" st
    WHERE
      st."placesAutorisees" IS NOT NULL
    ORDER BY
      st."structureId",
      st."year" DESC
  ),
  cpom_convention_dates AS (
    SELECT DISTINCT
      ON (aa."cpomId") aa."cpomId",
      aa."startDate" AS "cpom_start",
      aa."endDate" AS "cpom_end"
    FROM
      public."ActeAdministratif" aa
    WHERE
      aa."cpomId" IS NOT NULL
      AND aa."category" = 'CONVENTION'
      AND aa."parentId" IS NULL
      AND aa."startDate" IS NOT NULL
      AND aa."endDate" IS NOT NULL
    ORDER BY
      aa."cpomId",
      aa."endDate" DESC
  ),
  structure_in_cpom_for_year AS (
    SELECT DISTINCT
      cs."structureId",
      gs."year"
    FROM
      public."CpomStructure" cs
      JOIN cpom_convention_dates cp ON cp."cpomId" = cs."cpomId"
      CROSS JOIN LATERAL GENERATE_SERIES(
        EXTRACT(
          YEAR
          FROM
            COALESCE(cs."dateStart", cp."cpom_start")
        )::int,
        EXTRACT(
          YEAR
          FROM
            COALESCE(cs."dateEnd", cp."cpom_end")
        )::int
      ) AS gs ("year")
  ),
  structure_budget_dernier_millesime AS (
    SELECT DISTINCT
      ON (b."structureId") b."structureId",
      b."year",
      b."dotationAccordee",
      b."dotationDemandee"
    FROM
      public."Budget" b
    WHERE
      b."structureId" IS NOT NULL
      AND b."isMissing" IS NOT TRUE
      AND (
        b."dotationAccordee" IS NOT NULL
        OR b."dotationDemandee" IS NOT NULL
      )
    ORDER BY
      b."structureId",
      b."year" DESC
  ),
  budget_dernier_millesime AS (
    SELECT
      sb."structureId",
      CASE
        WHEN sic."structureId" IS NOT NULL THEN NULL
        ELSE COALESCE(sb."dotationAccordee", sb."dotationDemandee")
      END AS "dotation_derniere_annee"
    FROM
      structure_budget_dernier_millesime sb
      LEFT JOIN structure_in_cpom_for_year sic ON sic."structureId" = sb."structureId"
      AND sic."year" = sb."year"
  )
SELECT
  sc."id" AS "id",
  sdm."placesAutorisees" AS "places_autorisees_structure",
  bdm."dotation_derniere_annee" AS "dotation_derniere_annee"
FROM
:"SCHEMA"."structures_core" sc
  LEFT JOIN structure_typologie_dernier_millesime sdm ON sdm."structureId" = sc."id"
  LEFT JOIN budget_dernier_millesime bdm ON bdm."structureId" = sc."id";
