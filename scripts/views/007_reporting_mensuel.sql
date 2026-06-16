-- Indicateurs d'impact mensuels
CREATE OR REPLACE VIEW:"SCHEMA"."reporting_mensuel" AS
SELECT
  m."month" AS "month",
  m."visits_count" AS "visits_count",
  sc."phone_calls_count" AS "phone_calls_count",
  sc."emails_count" AS "emails_count",
  CASE
    WHEN m."visits_count" > 0 THEN (
      (COALESCE(sc."phone_calls_count", 0) + COALESCE(sc."emails_count", 0))::numeric / m."visits_count"::numeric
    ) * 1000
    ELSE NULL
  END AS "score_besoin_support_pour_mille",
  m."updates_count" AS "updates_count",
  q."indicateurs_utiles_count" AS "indicateurs_utiles_count",
  q."indicateurs_impact_count" AS "indicateurs_impact_count"
FROM
  reporting."monthly_reporting_metric" m
  LEFT JOIN reporting."monthly_support_contact" sc ON sc."month" = m."month"
  LEFT JOIN reporting."monthly_structures_global_quality_count" q ON q."month" = m."month";
