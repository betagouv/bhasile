-- Objective: places quality indicators per structure
-- One row per structure, boolean columns for places-related data quality issues
--
-- Notes:
-- - Checks that specific places (LGBT, FVV TEH, PMR) are not greater than authorized places
-- - Checks are done on the current version's `public."StructureTypologie"` rows
-- - Compares places between structure and addresses (difference > 10%)
CREATE OR REPLACE VIEW:"SCHEMA"."structures_places_quality" AS
WITH
  -- Last typology by structure (current version)
  structure_typologie_dernier_millesime AS (
    SELECT DISTINCT
      ON (scv."structureId") scv."structureId" AS "structureId",
      st."placesAutorisees",
      st."pmr",
      st."lgbt",
      st."fvvTeh",
      st."year"
    FROM
:"SCHEMA"."structures_current_version" scv
      JOIN public."StructureTypologie" st ON st."structureVersionId" = scv."version_id"
    ORDER BY
      scv."structureId",
      st."year" DESC
  ),
  -- Last typology by address (current version)
  adresse_typologie_dernier_millesime AS (
    SELECT DISTINCT
      ON (aty."adresseId") scv."structureId" AS "structureId",
      a."id" AS "adresse_id",
      aty."placesAutorisees",
      aty."qpv",
      aty."logementSocial",
      aty."year"
    FROM
:"SCHEMA"."structures_current_version" scv
      JOIN public."Adresse" a ON a."structureVersionId" = scv."version_id"
      JOIN public."AdresseTypologie" aty ON aty."adresseId" = a."id"
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
      s."id",
      COALESCE(
        ABS(
          COALESCE(sdm."placesAutorisees", 0) - COALESCE(aa."places_autorisees_adresse", 0)
        ) / NULLIF(COALESCE(sdm."placesAutorisees", 0)::float, 0) * 100,
        0
      ) AS pct_diff_places_adresse
    FROM
      public."Structure" s
      LEFT JOIN structure_typologie_dernier_millesime sdm ON sdm."structureId" = s."id"
      LEFT JOIN adresses_agregees aa ON aa."structureId" = s."id"
  ),
  -- Specific places issues (current version, year by year)
  specific_places_issues AS (
    SELECT
      scv."structureId" AS "structureId",
      BOOL_OR(
        st."lgbt" > st."placesAutorisees"
        OR st."fvvTeh" > st."placesAutorisees"
        OR st."pmr" > st."placesAutorisees"
      ) AS "has_issue_specific_places_gt_places_autorisees"
    FROM
:"SCHEMA"."structures_current_version" scv
      JOIN public."StructureTypologie" st ON st."structureVersionId" = scv."version_id"
    GROUP BY
      scv."structureId"
  )
SELECT
  s."id" AS "id",
  -- Specific places > authorized places
  COALESCE(spi."has_issue_specific_places_gt_places_autorisees", FALSE) AS "has_issue_specific_places_gt_places_autorisees",
  -- Places structure vs addresses: difference > 10%
  COALESCE(pc."pct_diff_places_adresse" > 10, FALSE) AS "has_issue_places_structure_vs_address_diff_gt_10pct"
FROM
  public."Structure" s
  LEFT JOIN specific_places_issues spi ON spi."structureId" = s."id"
  LEFT JOIN places_comparison pc ON pc."id" = s."id";
