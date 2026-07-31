-- Objective: places quality indicators per structure
-- One row per structure, boolean columns for places-related data quality issues
--
-- Notes:
-- - Checks that specific places (LGBT, FVV TEH, PMR) are not greater than authorized places
-- - Checks are done year by year on `public."StructureTypologie"`
-- - Compares places between structure and addresses (difference > 10%)
CREATE OR REPLACE VIEW:"SCHEMA"."structures_places_quality" AS
WITH
  -- Aggregate authorized places by structure, from its addresses
  adresses_agregees AS (
    SELECT
      sc."id" AS "structureId",
      SUM(a."placesAutorisees") AS places_autorisees_adresse
    FROM
      public."Adresse" a
      JOIN:"SCHEMA"."structures_core" sc ON sc."structure_version_id" = a."structureVersionId"
    WHERE
      a."placesAutorisees" IS NOT NULL
    GROUP BY
      sc."id"
  ),
  -- Places comparison: structure vs addresses
  places_comparison AS (
    SELECT
      sc."id",
      COALESCE(
        ABS(
          COALESCE(sv."placesAutorisees", 0) - COALESCE(aa."places_autorisees_adresse", 0)
        ) / NULLIF(COALESCE(sv."placesAutorisees", 0)::float, 0) * 100,
        0
      ) AS pct_diff_places_adresse
    FROM
:"SCHEMA"."structures_core" sc
      INNER JOIN public."StructureVersion" sv ON sv."id" = sc."structure_version_id"
      LEFT JOIN adresses_agregees aa ON aa."structureId" = sc."id"
  ),
  -- Aggregate specific places counts across all years (structure typology history)
  structure_typologie_places_max AS (
    SELECT
      sc."id" AS "structureId",
      MAX(st."lgbt") AS "lgbt_places",
      MAX(st."fvvTeh") AS "fvvteh_places"
    FROM
:"SCHEMA"."structures_core" sc
      INNER JOIN public."StructureTypologie" st ON st."structureId" = sc."id"
    WHERE
      st."year" <= EXTRACT(
        YEAR
        FROM
          CURRENT_DATE
      )
    GROUP BY
      sc."id"
  ),
  -- Specific places issues (year by year)
  specific_places_issues AS (
    SELECT
      sc."id" AS "structureId",
      BOOL_OR(
        st."lgbt" > st."placesAutorisees"
        OR st."fvvTeh" > st."placesAutorisees"
        OR st."pmr" > st."placesAutorisees"
      ) AS "has_issue_specific_places_gt_places_autorisees"
    FROM
:"SCHEMA"."structures_core" sc
      INNER JOIN public."StructureTypologie" st ON st."structureId" = sc."id"
    WHERE
      st."year" <= EXTRACT(
        YEAR
        FROM
          CURRENT_DATE
      )
    GROUP BY
      sc."id"
  )
SELECT
  sc."id" AS "id",
  -- Places counts (max across all millésimes)
  stpm."lgbt_places" AS "lgbt_places",
  stpm."fvvteh_places" AS "fvvteh_places",
  -- Specific places > authorized places
  COALESCE(spi."has_issue_specific_places_gt_places_autorisees", FALSE) AS "has_issue_specific_places_gt_places_autorisees",
  -- Incoherence between boolean flags (StructureVersion) and places counts (StructureTypologie history)
  COALESCE(
    (
      (
        sv."lgbt" IS TRUE
        AND COALESCE(stpm."lgbt_places", 0) = 0
      )
      OR (
        sv."lgbt" IS FALSE
        AND COALESCE(stpm."lgbt_places", 0) > 0
      )
    ),
    FALSE
  ) AS "has_issue_incoherence_lgbt_places",
  COALESCE(
    (
      (
        sv."fvvTeh" IS TRUE
        AND COALESCE(stpm."fvvteh_places", 0) = 0
      )
      OR (
        sv."fvvTeh" IS FALSE
        AND COALESCE(stpm."fvvteh_places", 0) > 0
      )
    ),
    FALSE
  ) AS "has_issue_incoherence_fvvteh_places",
  -- Places structure vs addresses: difference > 10%
  COALESCE(pc."pct_diff_places_adresse" > 10, FALSE) AS "has_issue_places_structure_vs_address_diff_gt_10pct"
FROM
:"SCHEMA"."structures_core" sc
  INNER JOIN public."StructureVersion" sv ON sv."id" = sc."structure_version_id"
  LEFT JOIN structure_typologie_places_max stpm ON stpm."structureId" = sc."id"
  LEFT JOIN specific_places_issues spi ON spi."structureId" = sc."id"
  LEFT JOIN places_comparison pc ON pc."id" = sc."id";
