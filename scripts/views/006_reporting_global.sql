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
  )
SELECT
  1 AS "id",
  gi."updated_at" AS "global_indicators_updated_at",
  gi."budget_annuel" AS "budget_annuel",
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
  -- Efficient (budget manuel ; dénominateurs = agrégats sur mois dispos)
  CASE
    WHEN u."updates_count_total" > 0
    AND gi."budget_annuel" IS NOT NULL THEN gi."budget_annuel" / u."updates_count_total"::numeric
    ELSE NULL
  END AS "cout_par_mise_a_jour",
  CASE
    WHEN qa."indicateurs_utiles_count_max" > 0
    AND gi."budget_annuel" IS NOT NULL THEN gi."budget_annuel" / qa."indicateurs_utiles_count_max"::numeric
    ELSE NULL
  END AS "cout_par_situation_utile",
  CASE
    WHEN qa."indicateurs_impact_count_max" > 0
    AND gi."budget_annuel" IS NOT NULL THEN gi."budget_annuel" / qa."indicateurs_impact_count_max"::numeric
    ELSE NULL
  END AS "cout_par_detection_impact"
FROM
  global_indicators_latest gi
  CROSS JOIN usage_agg u
  CROSS JOIN quality_agg qa;
