-- Objective: places quality indicators per structure
-- One row per structure, boolean columns for places-related data quality issues
--
-- Notes:
-- - Checks that specific places (LGBT, FVV TEH, PMR) are not greater than authorized places
-- - Checks are done year by year on `public."StructureTypologie"`
-- - Compares places between structure and addresses (difference > 10%)
CREATE OR REPLACE VIEW:"SCHEMA"."structures_places_quality" AS
WITH
  -- Last typology by address
  adresse_typologie_dernier_millesime AS (
    SELECT DISTINCT
      ON (aty."adresseId") sc."id" AS "structureId",
      a."id" AS "adresse_id",
      aty."placesAutorisees",
      aty."qpv",
      aty."logementSocial",
      aty."year"
    FROM
      public."AdresseTypologie" aty
      JOIN public."Adresse" a ON a."id" = aty."adresseId"
      JOIN:"SCHEMA"."structures_core" sc ON sc."structure_version_id" = a."structureVersionId"
    WHERE
      aty."placesAutorisees" IS NOT NULL
    ORDER BY
      aty."adresseId",
      aty."year" DESC
  ),
  -- Aggregate by structure on the last typologies of addresses
  adresses_agregees AS (
    SELECT
      adm."structureId",
      SUM(adm."placesAutorisees") AS places_autorisees_adresse
    FROM
      adresse_typologie_dernier_millesime adm
    GROUP BY
      adm."structureId"
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
