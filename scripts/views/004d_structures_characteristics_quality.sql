-- Objective: characteristics quality indicators per structure
-- One row per structure, boolean columns for characteristics-related data quality issues
--
-- Issue: DNA code incoherent with departement
CREATE OR REPLACE VIEW:"SCHEMA"."structures_characteristics_quality" AS
SELECT
  s."id" AS "id",
  -- DNA code departement prefix must match structure departementAdministratif
  COALESCE(
    BOOL_OR(
      SUBSTRING(
        d."code"
        FROM
          2 FOR LENGTH(TRIM(s."departementAdministratif"))
      ) <> TRIM(s."departementAdministratif")
    ),
    FALSE
  ) AS "has_issue_dept_code",
  -- Structure linked to more than one DNA
  (COUNT(DISTINCT ds."dnaId") > 1) AS "has_issue_multi_dna",
  -- Structure associated to a CPOM that has only one structure (mono-structure CPOM)
  COALESCE(BOOL_OR(cpom_counts."structuresCount" <= 1), FALSE) AS "has_issue_cpom_mono_structure"
FROM
  public."Structure" s
  LEFT JOIN public."DnaStructure" ds ON ds."structureId" = s."id"
  LEFT JOIN public."Dna" d ON d."id" = ds."dnaId"
  LEFT JOIN public."CpomStructure" cs ON cs."structureId" = s."id"
  LEFT JOIN (
    SELECT
      cs2."cpomId" AS "cpomId",
      COUNT(*)::int AS "structuresCount"
    FROM
      public."CpomStructure" cs2
    GROUP BY
      cs2."cpomId"
  ) cpom_counts ON cpom_counts."cpomId" = cs."cpomId"
GROUP BY
  s."id";
