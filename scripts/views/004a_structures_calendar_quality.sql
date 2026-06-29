-- Objective: calendar quality indicators per structure
-- One row per structure, boolean columns for calendar-related data quality issues
--
-- Notes:
-- - Calendar dates are derived now from Actes Administratifs
CREATE OR REPLACE VIEW:"SCHEMA"."structures_calendar_quality" AS
WITH
  actes_administratifs_aggregate AS (
    SELECT
      aa."structureId" AS "id",
      MIN(
        CASE
          WHEN aa."category" = 'CONVENTION' THEN aa."startDate"
        END
      ) AS "debutConvention",
      MAX(
        CASE
          WHEN aa."category" = 'CONVENTION' THEN aa."endDate"
        END
      ) AS "finConvention",
      MIN(
        CASE
          WHEN aa."category" = 'ARRETE_AUTORISATION' THEN aa."startDate"
        END
      ) AS "debutAutorisation",
      MAX(
        CASE
          WHEN aa."category" = 'ARRETE_AUTORISATION' THEN aa."endDate"
        END
      ) AS "finAutorisation"
    FROM
      public."ActeAdministratif" aa
    WHERE
      aa."category" IN ('CONVENTION', 'ARRETE_AUTORISATION')
      AND aa."isMissing" IS NOT TRUE
    GROUP BY
      aa."structureId"
  )
SELECT
  sc."id" AS "id",
  -- Authorized structures: authorization period must be 15 years (based on actes administratifs)
  CASE
    WHEN sc."structure_type" IN ('CADA', 'CPH') THEN (
      aaa."debutAutorisation" IS NOT NULL
      AND aaa."finAutorisation" IS NOT NULL
      AND (
        EXTRACT(
          YEAR
          FROM
            aaa."finAutorisation"
        )::int - EXTRACT(
          YEAR
          FROM
            aaa."debutAutorisation"
        )::int
      ) <> 15
    )
    ELSE FALSE
  END AS "has_issue_authorisation_period_not_15y",
  -- Authorized structures: convention should last 5 years (based on actes administratifs)
  CASE
    WHEN sc."structure_type" IN ('CADA', 'CPH') THEN (
      aaa."debutConvention" IS NOT NULL
      AND aaa."finConvention" IS NOT NULL
      AND (
        EXTRACT(
          YEAR
          FROM
            aaa."finConvention"
        )::int - EXTRACT(
          YEAR
          FROM
            aaa."debutConvention"
        )::int
      ) <> 5
    )
    ELSE FALSE
  END AS "has_issue_authorized_convention_not_5y",
  -- Authorized structures: convention must be within the authorization period (based on actes administratifs)
  CASE
    WHEN sc."structure_type" IN ('CADA', 'CPH') THEN (
      aaa."debutAutorisation" IS NOT NULL
      AND aaa."finAutorisation" IS NOT NULL
      AND aaa."debutConvention" IS NOT NULL
      AND aaa."finConvention" IS NOT NULL
      AND (
        EXTRACT(
          YEAR
          FROM
            aaa."debutConvention"
        )::int < EXTRACT(
          YEAR
          FROM
            aaa."debutAutorisation"
        )::int
        OR EXTRACT(
          YEAR
          FROM
            aaa."finConvention"
        )::int > EXTRACT(
          YEAR
          FROM
            aaa."finAutorisation"
        )::int
      )
    )
    ELSE FALSE
  END AS "has_issue_authorized_convention_outside_authorisation_period",
  -- Authorized structures: missing convention in actes administratifs (convention is required)
  CASE
    WHEN sc."structure_type" IN ('CADA', 'CPH') THEN (
      aaa."debutConvention" IS NULL
      OR aaa."finConvention" IS NULL
    )
    ELSE FALSE
  END AS "has_issue_authorized_convention_missing_or_expired",
  -- Dates in Structure should match dates derived from Actes Administratifs (when present)
  COALESCE(
    (
      (
        aaa."debutConvention" IS NOT NULL
        OR aaa."finConvention" IS NOT NULL
      )
      AND (
        aaa."debutConvention" IS DISTINCT FROM s."debutConvention"
        OR aaa."finConvention" IS DISTINCT FROM s."finConvention"
      )
    ),
    FALSE
  ) AS "has_issue_convention_dates_differ_from_actes_administratifs",
  COALESCE(
    (
      sc."structure_type" IN ('CADA', 'CPH')
      AND (
        aaa."debutAutorisation" IS NOT NULL
        OR aaa."finAutorisation" IS NOT NULL
      )
      AND (
        aaa."debutAutorisation" IS DISTINCT FROM s."debutPeriodeAutorisation"
        OR aaa."finAutorisation" IS DISTINCT FROM s."finPeriodeAutorisation"
      )
    ),
    FALSE
  ) AS "has_issue_authorisation_dates_differ_from_actes_administratifs",
  -- Evaluation should be performed at least every 5 years, before the end of the convention.
  CASE
    WHEN aaa."finConvention" IS NULL THEN FALSE
    WHEN sc."structure_type" IN ('HUDA', 'CAES') THEN FALSE
    WHEN MAX(e."date") IS NULL THEN TRUE
    WHEN MAX(e."date") < (aaa."finConvention" - INTERVAL '5 years') THEN TRUE
    ELSE FALSE
  END AS "has_issue_evaluation_not_done_in_time",
  -- Subsidized structures: convention duration must be <= 3 years (based on actes administratifs)
  CASE
    WHEN sc."structure_type" IN ('HUDA', 'CAES') THEN (
      aaa."debutConvention" IS NOT NULL
      AND aaa."finConvention" IS NOT NULL
      AND (
        EXTRACT(
          YEAR
          FROM
            aaa."finConvention"
        )::int - EXTRACT(
          YEAR
          FROM
            aaa."debutConvention"
        )::int
      ) > 3
    )
    ELSE FALSE
  END AS "has_issue_subsidized_convention_gt_3y"
FROM
:"SCHEMA"."structures_core" sc
  INNER JOIN public."Structure" s ON s."id" = sc."id"
  LEFT JOIN actes_administratifs_aggregate aaa ON aaa."id" = sc."id"
  LEFT JOIN public."Evaluation" e ON e."structureId" = sc."id"
GROUP BY
  sc."id",
  sc."structure_type",
  s."debutConvention",
  s."finConvention",
  s."debutPeriodeAutorisation",
  s."finPeriodeAutorisation",
  aaa."debutConvention",
  aaa."finConvention",
  aaa."debutAutorisation",
  aaa."finAutorisation";
