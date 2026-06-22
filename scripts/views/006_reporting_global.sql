-- Indicateurs d'impact globaux
CREATE OR REPLACE VIEW:"SCHEMA"."reporting_global" AS
WITH
  global_indicators_latest AS (
    SELECT
      gi.*
    FROM
      reporting."global_indicators" gi
    ORDER BY
      gi."updated_at" DESC
    LIMIT
      1
  ),
  cpom_dernier_millesime AS (
    SELECT DISTINCT
      ON (b."cpomId") b."cpomId",
      b."year"
    FROM
      public."Budget" b
    WHERE
      b."cpomId" IS NOT NULL
      AND b."isMissing" IS NOT TRUE
      AND (
        b."dotationAccordee" IS NOT NULL
        OR b."dotationDemandee" IS NOT NULL
      )
    ORDER BY
      b."cpomId",
      b."year" DESC
  ),
  parc_agg AS (
    SELECT
      COALESCE(SUM(sa."places_autorisees_structure"), 0)::int AS "places_suivies_total",
      COALESCE(SUM(sa."dotation_derniere_annee"), 0)::numeric AS "dotation_structures_hors_cpom",
      (
        SELECT
          COALESCE(SUM(COALESCE(b."dotationAccordee", b."dotationDemandee")), 0)::numeric
        FROM
          public."Budget" b
          JOIN cpom_dernier_millesime cdm ON cdm."cpomId" = b."cpomId"
          AND cdm."year" = b."year"
        WHERE
          b."cpomId" IS NOT NULL
          AND b."isMissing" IS NOT TRUE
          AND (
            b."dotationAccordee" IS NOT NULL
            OR b."dotationDemandee" IS NOT NULL
          )
      ) AS "dotation_cpoms"
    FROM
:"SCHEMA"."structures_aggregates" sa
  ),
  reporting_metrics AS (
    SELECT
      (
        SELECT
          COALESCE(SUM(m."updates_count"), 0)::int
        FROM
          reporting."monthly_reporting_metric" m
      ) AS "updates_count_total",
      (
        SELECT
          COALESCE(MAX(q."indicateurs_utiles_count"), 0)::int
        FROM
          reporting."monthly_structures_global_quality_count" q
      ) AS "indicateurs_utiles_count_max",
      (
        SELECT
          COALESCE(MAX(q."indicateurs_impact_count"), 0)::int
        FROM
          reporting."monthly_structures_global_quality_count" q
      ) AS "indicateurs_impact_count_max",
      (
        SELECT
          MIN(ua."createdAt")
        FROM
          public."UserAction" ua
        WHERE
          ua."action" = 'UPDATE'
      ) AS "first_update_at"
  )
SELECT
  1 AS "id",
  gi."updated_at" AS "global_indicators_updated_at",
  gi."budget_annuel" AS "budget_annuel",
  pa."places_suivies_total",
  pa."dotation_structures_hors_cpom",
  pa."dotation_cpoms",
  pa."dotation_structures_hors_cpom" + pa."dotation_cpoms" AS "dotation_parc_total",
  rm."updates_count_total",
  rm."indicateurs_utiles_count_max",
  rm."indicateurs_impact_count_max",
  (
    COALESCE(gi."note_prise_en_main", 0) + COALESCE(gi."note_clarte_infos", 0) + COALESCE(gi."note_facilite_utilisation", 0) + COALESCE(gi."note_robustesse_tech", 0)
  ) / NULLIF(
    (
      CASE
        WHEN gi."note_prise_en_main" IS NOT NULL THEN 1
        ELSE 0
      END + CASE
        WHEN gi."note_clarte_infos" IS NOT NULL THEN 1
        ELSE 0
      END + CASE
        WHEN gi."note_facilite_utilisation" IS NOT NULL THEN 1
        ELSE 0
      END + CASE
        WHEN gi."note_robustesse_tech" IS NOT NULL THEN 1
        ELSE 0
      END
    ),
    0
  ) AS "note_facilite_utilisation_moyenne_4_criteres",
  gi."note_remplacement_excel" AS "note_remplacement_excel",
  gi."note_gain_temps" AS "note_gain_temps",
  gi."note_amelioration_pilotage" AS "note_amelioration_pilotage",
  rm."first_update_at",
  CASE
    WHEN gi."budget_annuel" IS NOT NULL
    AND rm."first_update_at" IS NOT NULL THEN (gi."budget_annuel" / 365.0) * (CURRENT_DATE - rm."first_update_at"::date)
    ELSE NULL
  END AS "budget_depense_prorata",
  CASE
    WHEN rm."updates_count_total" > 0
    AND gi."budget_annuel" IS NOT NULL
    AND rm."first_update_at" IS NOT NULL THEN ((gi."budget_annuel" / 365.0) * (CURRENT_DATE - rm."first_update_at"::date)) / rm."updates_count_total"::numeric
    ELSE NULL
  END AS "cout_par_mise_a_jour",
  CASE
    WHEN rm."indicateurs_utiles_count_max" > 0
    AND gi."budget_annuel" IS NOT NULL
    AND rm."first_update_at" IS NOT NULL THEN ((gi."budget_annuel" / 365.0) * (CURRENT_DATE - rm."first_update_at"::date)) / rm."indicateurs_utiles_count_max"::numeric
    ELSE NULL
  END AS "cout_par_situation_utile",
  CASE
    WHEN rm."indicateurs_impact_count_max" > 0
    AND gi."budget_annuel" IS NOT NULL
    AND rm."first_update_at" IS NOT NULL THEN ((gi."budget_annuel" / 365.0) * (CURRENT_DATE - rm."first_update_at"::date)) / rm."indicateurs_impact_count_max"::numeric
    ELSE NULL
  END AS "cout_par_detection_impact"
FROM
  global_indicators_latest gi,
  reporting_metrics rm,
  parc_agg pa;
