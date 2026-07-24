-- Objective: per-structure impact inputs (places + budget hors CPOM)
CREATE OR REPLACE VIEW:"SCHEMA"."structures_aggregates" AS
WITH
  structure_places_autorisees AS (
    SELECT
      sc."id" AS "structureId",
      sv."placesAutorisees"
    FROM
:"SCHEMA"."structures_core" sc
      INNER JOIN public."StructureVersion" sv ON sv."id" = sc."structure_version_id"
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
        WHEN EXISTS (
          SELECT
            1
          FROM
            public."CpomStructure" cs
            JOIN cpom_convention_dates cp ON cp."cpomId" = cs."cpomId"
          WHERE
            cs."structureId" = sb."structureId"
            AND sb."year" >= EXTRACT(
              YEAR
              FROM
                COALESCE(cs."dateStart", cp."cpom_start")
            )::int
            AND sb."year" <= EXTRACT(
              YEAR
              FROM
                COALESCE(cs."dateEnd", cp."cpom_end")
            )::int
        ) THEN NULL
        ELSE COALESCE(sb."dotationAccordee", sb."dotationDemandee")
      END AS "dotation_derniere_annee"
    FROM
      structure_budget_dernier_millesime sb
  )
SELECT
  sc."id" AS "id",
  sc."code_bhasile" AS "code_bhasile",
  sc."dna_codes" AS "dna_codes",
  sc."departement_administratif" AS "departement_administratif",
  sc."departement" AS "departement",
  sc."region" AS "region",
  sc."operateur" AS "operateur",
  sc."structure_type" AS "structure_type",
  sc."public" AS "public",
  sc."latitude" AS "latitude",
  sc."longitude" AS "longitude",
  sc."updated_at" AS "updated_at",
  sf."finalisation_status" AS "finalisation_status",
  sf."finalisation_status_detail" AS "finalisation_status_detail",
  sdm."placesAutorisees" AS "places_autorisees_structure",
  bdm."dotation_derniere_annee" AS "dotation_derniere_annee"
FROM
:"SCHEMA"."structures_core" sc
  LEFT JOIN:"SCHEMA"."structures_filling" sf ON sf."id" = sc."id"
  LEFT JOIN structure_places_autorisees sdm ON sdm."structureId" = sc."id"
  LEFT JOIN budget_dernier_millesime bdm ON bdm."structureId" = sc."id";
