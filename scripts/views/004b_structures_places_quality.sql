-- Objective: places quality indicators per structure
-- One row per structure, boolean columns for places-related data quality issues
--
-- Notes:
-- - Checks that specific places (LGBT, FVV TEH, PMR) are not greater than authorized places
-- - Checks are done year by year on `public."StructureTypologie"`
-- - Compares places between structure and addresses (difference > 10%)
CREATE OR REPLACE VIEW :"SCHEMA"."structures_places_quality" AS WITH -- Last typology by structure
  structure_typologie_dernier_millesime AS (
    SELECT DISTINCT ON (st."structureDnaCode") st."structureDnaCode",
      st."placesAutorisees",
      st."pmr",
      st."lgbt",
      st."fvvTeh",
      st."year"
    FROM public."StructureTypologie" st
    ORDER BY st."structureDnaCode",
      st."year" DESC
  ),
  -- Last typology by address
  adresse_typologie_dernier_millesime AS (
    SELECT DISTINCT ON (aty."adresseId") a."structureDnaCode",
      a."id" AS "adresse_id",
      aty."placesAutorisees",
      aty."qpv",
      aty."logementSocial",
      aty."year"
    FROM public."AdresseTypologie" aty
      JOIN public."Adresse" a ON a."id" = aty."adresseId"
    ORDER BY aty."adresseId",
      aty."year" DESC
  ),
  -- Aggregate by structure on the last typologies of addresses
  adresses_agregees AS (
    SELECT adm."structureDnaCode",
      SUM(adm."placesAutorisees") AS places_autorisees_adresse
    FROM adresse_typologie_dernier_millesime adm
    GROUP BY adm."structureDnaCode"
  ),
  -- Places comparison: structure vs addresses
  places_comparison AS (
    SELECT s."dnaCode",
      COALESCE(
        ABS(
          COALESCE(sdm."placesAutorisees", 0) - COALESCE(aa."places_autorisees_adresse", 0)
        ) / NULLIF(COALESCE(sdm."placesAutorisees", 0)::float, 0) * 100,
        0
      ) AS pct_diff_places_adresse
    FROM public."Structure" s
      LEFT JOIN structure_typologie_dernier_millesime sdm ON sdm."structureDnaCode" = s."dnaCode"
      LEFT JOIN adresses_agregees aa ON aa."structureDnaCode" = s."dnaCode"
  ),
  -- Specific places issues (year by year)
  specific_places_issues AS (
    SELECT st."structureDnaCode" AS "dnaCode",
      BOOL_OR(
        st."lgbt" > st."placesAutorisees"
        OR st."fvvTeh" > st."placesAutorisees"
        OR st."pmr" > st."placesAutorisees"
      ) AS "has_issue_specific_places_gt_places_autorisees"
    FROM public."StructureTypologie" st
    GROUP BY st."structureDnaCode"
  )
SELECT s."dnaCode" AS "dnaCode",
  -- Specific places > authorized places
  COALESCE(
    spi."has_issue_specific_places_gt_places_autorisees",
    FALSE
  ) AS "has_issue_specific_places_gt_places_autorisees",
  -- Places structure vs addresses: difference > 10%
  COALESCE(
    pc."pct_diff_places_adresse" > 10,
    FALSE
  ) AS "has_issue_places_structure_vs_address_diff_gt_10pct"
FROM public."Structure" s
  LEFT JOIN specific_places_issues spi ON spi."dnaCode" = s."dnaCode"
  LEFT JOIN places_comparison pc ON pc."dnaCode" = s."dnaCode";