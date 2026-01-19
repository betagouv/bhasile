-- Objective: calendar quality indicators per structure
-- One row per structure, boolean columns for calendar-related data quality issues
--
-- Notes:
-- - "Conventions" are stored on `public."Structure"`: `debutConvention`, `finConvention`.
-- - "Période d'autorisation" is stored on `public."Structure"`: `debutPeriodeAutorisation`, `finPeriodeAutorisation`.
CREATE OR REPLACE VIEW :"SCHEMA"."structures_calendar_quality" AS WITH structures AS (
    SELECT s."dnaCode",
      s."type" AS "structureType",
      s."debutPeriodeAutorisation",
      s."finPeriodeAutorisation",
      s."debutConvention",
      s."finConvention"
    FROM public."Structure" s
  )
SELECT s."dnaCode" AS "dnaCode",
  -- Base data presence flags
  CASE
    WHEN s."structureType" IN ('CADA', 'CPH') THEN (
      s."debutPeriodeAutorisation" IS NULL
      OR s."finPeriodeAutorisation" IS NULL
    )
    ELSE FALSE
  END AS "has_authorisation_dates_undefined",
  CASE
    WHEN s."structureType" IN ('CADA', 'CPH', 'HUDA', 'CAES') THEN (
      s."debutConvention" IS NULL
      OR s."finConvention" IS NULL
    )
    ELSE FALSE
  END AS "has_convention_dates_undefined",
  -- Authorized structures: authorization period must be 15 years
  CASE
    WHEN s."structureType" IN ('CADA', 'CPH') THEN (
      s."debutPeriodeAutorisation" IS NOT NULL
      AND s."finPeriodeAutorisation" IS NOT NULL
      AND (
        EXTRACT(
          YEAR
          FROM s."finPeriodeAutorisation"
        )::int - EXTRACT(
          YEAR
          FROM s."debutPeriodeAutorisation"
        )::int
      ) <> 15
    )
    ELSE FALSE
  END AS "has_issue_authorisation_period_not_15y",
  -- Authorized structures: convention should last 5 years
  CASE
    WHEN s."structureType" IN ('CADA', 'CPH') THEN (
      s."debutConvention" IS NOT NULL
      AND s."finConvention" IS NOT NULL
      AND (
        EXTRACT(
          YEAR
          FROM s."finConvention"
        )::int - EXTRACT(
          YEAR
          FROM s."debutConvention"
        )::int
      ) <> 5
    )
    ELSE FALSE
  END AS "has_issue_authorized_convention_not_5y",
  -- Authorized structures: convention must be within the authorization period
  CASE
    WHEN s."structureType" IN ('CADA', 'CPH') THEN (
      s."debutPeriodeAutorisation" IS NOT NULL
      AND s."finPeriodeAutorisation" IS NOT NULL
      AND s."debutConvention" IS NOT NULL
      AND s."finConvention" IS NOT NULL
      AND (
        EXTRACT(
          YEAR
          FROM s."debutConvention"
        )::int < EXTRACT(
          YEAR
          FROM s."debutPeriodeAutorisation"
        )::int
        OR EXTRACT(
          YEAR
          FROM s."finConvention"
        )::int > EXTRACT(
          YEAR
          FROM s."finPeriodeAutorisation"
        )::int
      )
    )
    ELSE FALSE
  END AS "has_issue_authorized_convention_outside_authorisation_period",
  -- Subsidized structures: convention duration must be <= 3 years
  CASE
    WHEN s."structureType" IN ('HUDA', 'CAES') THEN (
      s."debutConvention" IS NOT NULL
      AND s."finConvention" IS NOT NULL
      AND (
        EXTRACT(
          YEAR
          FROM s."finConvention"
        )::int - EXTRACT(
          YEAR
          FROM s."debutConvention"
        )::int
      ) > 3
    )
    ELSE FALSE
  END AS "has_issue_subsidized_convention_gt_3y"
FROM structures s;