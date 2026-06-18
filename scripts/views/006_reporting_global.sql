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
  usage_agg AS (
    SELECT
      COALESCE(SUM(m."updates_count"), 0)::int AS "updates_count_total"
    FROM
      reporting."monthly_reporting_metric" m
  ),
  quality_agg AS (
    SELECT
      COALESCE(MAX(q."indicateurs_utiles_count"), 0)::int AS "indicateurs_utiles_count_max",
      COALESCE(MAX(q."indicateurs_impact_count"), 0)::int AS "indicateurs_impact_count_max"
    FROM
      reporting."monthly_structures_global_quality_count" q
  ),
  first_update AS (
    SELECT
      MIN(ua."createdAt") AS "first_update_at"
    FROM
      public."UserAction" ua
    WHERE
      ua."action" = 'UPDATE'
  ),
  budget_usage AS (
    SELECT
      gi."budget_annuel",
      fu."first_update_at",
      CASE
        WHEN gi."budget_annuel" IS NOT NULL
        AND fu."first_update_at" IS NOT NULL THEN (gi."budget_annuel" / 365.0) * (CURRENT_DATE - fu."first_update_at"::date)
        ELSE NULL
      END AS "budget_depense_prorata"
    FROM
      global_indicators_latest gi
      CROSS JOIN first_update fu
  ),
  parc_structures_agg AS (
    SELECT
      COALESCE(SUM(sa."places_autorisees_structure"), 0)::int AS "places_suivies_total",
      COALESCE(SUM(sa."dotation_derniere_annee"), 0)::numeric AS "dotation_structures_hors_cpom"
    FROM
:"SCHEMA"."structures_aggregates" sa
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
  cpom_budgets_agg AS (
    SELECT
      COALESCE(SUM(COALESCE(b."dotationAccordee", b."dotationDemandee")), 0)::numeric AS "dotation_cpoms"
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
  ),
  parc_agg AS (
    SELECT
      psa."places_suivies_total",
      psa."dotation_structures_hors_cpom",
      cba."dotation_cpoms",
      psa."dotation_structures_hors_cpom" + cba."dotation_cpoms" AS "dotation_parc_total"
    FROM
      parc_structures_agg psa
      CROSS JOIN cpom_budgets_agg cba
  )
SELECT
  1 AS "id",
  gi."updated_at" AS "global_indicators_updated_at",
  gi."budget_annuel" AS "budget_annuel",
  pa."places_suivies_total",
  pa."dotation_structures_hors_cpom",
  pa."dotation_cpoms",
  pa."dotation_parc_total",
  u."updates_count_total",
  qa."indicateurs_utiles_count_max",
  qa."indicateurs_impact_count_max",
  -- Utilisable : moyenne des 4 notes questionnaire
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
  bu."first_update_at" AS "first_update_at",
  bu."budget_depense_prorata" AS "budget_depense_prorata",
  -- Efficient (budget manuel proratisé au jour depuis la 1re màj en base ; dénominateurs = agrégats sur mois dispos)
  CASE
    WHEN u."updates_count_total" > 0
    AND bu."budget_depense_prorata" IS NOT NULL THEN bu."budget_depense_prorata" / u."updates_count_total"::numeric
    ELSE NULL
  END AS "cout_par_mise_a_jour",
  CASE
    WHEN qa."indicateurs_utiles_count_max" > 0
    AND bu."budget_depense_prorata" IS NOT NULL THEN bu."budget_depense_prorata" / qa."indicateurs_utiles_count_max"::numeric
    ELSE NULL
  END AS "cout_par_situation_utile",
  CASE
    WHEN qa."indicateurs_impact_count_max" > 0
    AND bu."budget_depense_prorata" IS NOT NULL THEN bu."budget_depense_prorata" / qa."indicateurs_impact_count_max"::numeric
    ELSE NULL
  END AS "cout_par_detection_impact"
FROM
  global_indicators_latest gi
  CROSS JOIN usage_agg u
  CROSS JOIN quality_agg qa
  CROSS JOIN budget_usage bu
  CROSS JOIN parc_agg pa;
