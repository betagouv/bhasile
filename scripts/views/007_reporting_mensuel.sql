-- Matrice Metabase — données MENSUELLES (cron, 1 ligne / mois)
-- Globaux (questionnaire + Efficient) : reporting."reporting_global"
-- Détail qualité : reporting."MonthlyStructuresGlobalQualityCount"
-- Visites par région : reporting."MonthlyReportingVisitsByRegion"
CREATE OR REPLACE VIEW:"SCHEMA"."reporting_mensuel" AS
SELECT
  m."month" AS "month",
  m."visitsCount" AS "visits_count",
  sc."phoneCallsCount" AS "phone_calls_count",
  sc."emailsCount" AS "emails_count",
  CASE
    WHEN m."visitsCount" > 0 THEN (
      (COALESCE(sc."phoneCallsCount", 0) + COALESCE(sc."emailsCount", 0))::numeric / m."visitsCount"::numeric
    ) * 1000
    ELSE NULL
  END AS "score_besoin_support_pour_mille",
  m."updatesCount" AS "updates_count",
  q."indicateursUtilesCount" AS "indicateurs_utiles_count",
  q."indicateursImpactCount" AS "indicateurs_impact_count"
FROM
  reporting."MonthlyReportingMetric" m
  LEFT JOIN reporting."MonthlySupportContact" sc ON sc."month" = m."month"
  LEFT JOIN reporting."MonthlyStructuresGlobalQualityCount" q ON q."month" = m."month";
