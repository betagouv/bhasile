-- Objective: activite quality indicators per structure
-- One row per structure, boolean columns for activite thresholds
CREATE OR REPLACE VIEW:"SCHEMA"."structures_activite_quality" AS
WITH
  activite_dernier_millesime_par_dna AS (
    SELECT DISTINCT
      ON (a."dnaCode") a."dnaCode",
      a."placesAutorisees",
      a."placesIndisponibles",
      a."presencesInduesBPI",
      a."presencesInduesDeboutees"
    FROM
      public."Activite" a
    WHERE
      a."dnaCode" IS NOT NULL
    ORDER BY
      a."dnaCode",
      a."date" DESC
  ),
  activite_par_structure AS (
    SELECT
      ds."structureId" AS "structureId",
      BOOL_OR(
        ad."placesAutorisees" IS NOT NULL
        AND ad."placesAutorisees" > 0
        AND ad."placesIndisponibles" IS NOT NULL
        AND (ad."placesIndisponibles"::float / ad."placesAutorisees"::float) * 100 > 3
      ) AS "has_issue_places_indisponibles_gt_3pct",
      BOOL_OR(
        ad."placesAutorisees" IS NOT NULL
        AND ad."placesAutorisees" > 0
        AND (
          COALESCE(ad."presencesInduesBPI", 0) + COALESCE(ad."presencesInduesDeboutees", 0)
        ) * 100.0 / ad."placesAutorisees"::float > 7
      ) AS "has_issue_presences_indues_gt_7pct"
    FROM
      activite_dernier_millesime_par_dna ad
      JOIN public."Dna" d ON d."code" = ad."dnaCode"
      JOIN public."DnaStructure" ds ON ds."dnaId" = d."id"
    GROUP BY
      ds."structureId"
  )
SELECT
  s."id" AS "id",
  COALESCE(act."has_issue_places_indisponibles_gt_3pct", FALSE) AS "has_issue_places_indisponibles_gt_3pct",
  -- Présences indues total > 7% : CADA + HUDA uniquement
  CASE
    WHEN s."type" IN ('CADA', 'HUDA') THEN COALESCE(act."has_issue_presences_indues_gt_7pct", FALSE)
    ELSE FALSE
  END AS "has_issue_presences_indues_gt_7pct"
FROM
  public."Structure" s
  LEFT JOIN activite_par_structure act ON act."structureId" = s."id";
