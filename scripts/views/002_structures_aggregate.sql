-- Objective: per-structure impact inputs (places + budget hors CPOM)
CREATE OR REPLACE VIEW:"SCHEMA"."structures_aggregates" AS
WITH
  finalized_versions AS (
    SELECT
      sv."id",
      sv."structureId",
      sv."effectiveDate",
      sv."placesAutorisees"
    FROM
      public."StructureVersion" sv
      LEFT JOIN public."StructureVersionTransformation" svt ON svt."id" = sv."structureVersionTransformationId"
      LEFT JOIN public."Form" f ON f."transformationId" = svt."transformationId"
    WHERE
      sv."structureId" IS NOT NULL
      AND (
        sv."structureVersionTransformationId" IS NULL
        OR f."status" IS TRUE
      )
  ),
  -- Same rule as the statistiques API (see dedicated doc to see business choices)
  resolved_typologies AS (
    SELECT
      st."structureId",
      st."year",
      CASE
        WHEN st."year" >= 2026 THEN (
          SELECT
            vf."placesAutorisees"
          FROM
            finalized_versions vf
          WHERE
            vf."structureId" = st."structureId"
            AND (
              vf."effectiveDate" IS NULL
              OR vf."effectiveDate" < LEAST(MAKE_DATE(st."year", 12, 31), (NOW() AT TIME ZONE 'UTC')::date) + 1
            )
          ORDER BY
            vf."effectiveDate" DESC NULLS LAST,
            vf."id" DESC
          LIMIT
            1
        )
        ELSE st."placesAutorisees"
      END AS "placesAutorisees"
    FROM
      public."StructureTypologie" st
    WHERE
      st."structureId" IS NOT NULL
      AND st."year" <= EXTRACT(
        YEAR
        FROM
          NOW() AT TIME ZONE 'UTC'
      )
  ),
  structure_places_autorisees AS (
    SELECT DISTINCT
      ON (tr."structureId") tr."structureId",
      tr."placesAutorisees"
    FROM
      resolved_typologies tr
      INNER JOIN public."Structure" s ON s."id" = tr."structureId"
    WHERE
      tr."placesAutorisees" IS NOT NULL
      AND s."type" IS NOT NULL
      AND (
        s."creationDate" IS NULL
        OR s."creationDate" < (NOW() AT TIME ZONE 'UTC')::date + 1
      )
      AND (
        s."fermetureDate" IS NULL
        OR s."fermetureDate" >= (NOW() AT TIME ZONE 'UTC')::date
      )
    ORDER BY
      tr."structureId",
      tr."year" DESC
  ),
  ongoing_cpoms AS (
    SELECT
      aa."cpomId",
      aa."startDate" AS "cpom_start",
      COALESCE(MAX(av."endDate"), aa."endDate") AS "cpom_end"
    FROM
      public."ActeAdministratif" aa
      LEFT JOIN public."ActeAdministratif" av ON av."parentId" = aa."id"
    WHERE
      aa."cpomId" IS NOT NULL
      AND aa."category" = 'CONVENTION_CPOM'
      AND aa."parentId" IS NULL
    GROUP BY
      aa."id",
      aa."cpomId",
      aa."startDate",
      aa."endDate"
    HAVING
      aa."startDate" <= (NOW() AT TIME ZONE 'UTC')::date
      AND COALESCE(MAX(av."endDate"), aa."endDate") >= (NOW() AT TIME ZONE 'UTC')::date
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
            JOIN ongoing_cpoms cp ON cp."cpomId" = cs."cpomId"
          WHERE
            cs."structureId" = sb."structureId"
            AND COALESCE(cs."dateStart", cp."cpom_start") <= (NOW() AT TIME ZONE 'UTC')::date
            AND COALESCE(cs."dateEnd", cp."cpom_end") >= (NOW() AT TIME ZONE 'UTC')::date
            AND EXISTS (
              SELECT
                1
              FROM
                public."Budget" b
              WHERE
                b."cpomId" = cs."cpomId"
                AND (
                  b."dotationAccordee" IS NOT NULL
                  OR b."dotationDemandee" IS NOT NULL
                )
            )
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
  INNER JOIN:"SCHEMA"."structures_filling" sf ON sf."id" = sc."id"
  LEFT JOIN structure_places_autorisees sdm ON sdm."structureId" = sc."id"
  LEFT JOIN budget_dernier_millesime bdm ON bdm."structureId" = sc."id";
