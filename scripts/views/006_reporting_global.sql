-- Indicateurs d'impact globaux
CREATE OR REPLACE VIEW:"SCHEMA"."reporting_global" AS
WITH
  global_indicators_latest AS (
    SELECT
      gi.*
    FROM
      reporting."GlobalIndicators" gi
    ORDER BY
      gi."updatedAt" DESC
    LIMIT
      1
  ),
  usage_agg AS (
    SELECT
      COALESCE(SUM(m."updatesCount"), 0)::int AS "updates_count_total"
    FROM
      reporting."MonthlyReportingMetric" m
  ),
  quality_agg AS (
    SELECT
      COALESCE(MAX(q."indicateursUtilesCount"), 0)::int AS "indicateurs_utiles_count_max",
      COALESCE(MAX(q."indicateursImpactCount"), 0)::int AS "indicateurs_impact_count_max"
    FROM
      reporting."MonthlyStructuresGlobalQualityCount" q
  )
SELECT
  1 AS "id",
  gi."updatedAt" AS "global_indicators_updated_at",
  gi."budgetAnnuel" AS "budget_annuel",
  u."updates_count_total",
  qa."indicateurs_utiles_count_max",
  qa."indicateurs_impact_count_max",
  -- Utilisable : moyenne des 4 notes questionnaire
  (
    COALESCE(gi."notePriseEnMain", 0) + COALESCE(gi."noteClarteInfos", 0) + COALESCE(gi."noteFaciliteUtilisation", 0) + COALESCE(gi."noteRobustesseTech", 0)
  ) / NULLIF(
    (
      CASE
        WHEN gi."notePriseEnMain" IS NOT NULL THEN 1
        ELSE 0
      END + CASE
        WHEN gi."noteClarteInfos" IS NOT NULL THEN 1
        ELSE 0
      END + CASE
        WHEN gi."noteFaciliteUtilisation" IS NOT NULL THEN 1
        ELSE 0
      END + CASE
        WHEN gi."noteRobustesseTech" IS NOT NULL THEN 1
        ELSE 0
      END
    ),
    0
  ) AS "note_facilite_utilisation_moyenne_4_criteres",
  gi."noteRemplacementExcel" AS "note_remplacement_excel",
  gi."noteGainTemps" AS "note_gain_temps",
  gi."noteAmeliorationPilotage" AS "note_amelioration_pilotage",
  -- Efficient (budget manuel ; dénominateurs = agrégats sur mois dispos)
  CASE
    WHEN u."updates_count_total" > 0
    AND gi."budgetAnnuel" IS NOT NULL THEN gi."budgetAnnuel" / u."updates_count_total"::numeric
    ELSE NULL
  END AS "cout_par_mise_a_jour",
  CASE
    WHEN qa."indicateurs_utiles_count_max" > 0
    AND gi."budgetAnnuel" IS NOT NULL THEN gi."budgetAnnuel" / qa."indicateurs_utiles_count_max"::numeric
    ELSE NULL
  END AS "cout_par_situation_utile",
  CASE
    WHEN qa."indicateurs_impact_count_max" > 0
    AND gi."budgetAnnuel" IS NOT NULL THEN gi."budgetAnnuel" / qa."indicateurs_impact_count_max"::numeric
    ELSE NULL
  END AS "cout_par_detection_impact"
FROM
  global_indicators_latest gi
  CROSS JOIN usage_agg u
  CROSS JOIN quality_agg qa;
