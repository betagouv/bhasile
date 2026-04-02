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
  ) AS "has_issue_dept_code"
FROM
  public."Structure" s
  LEFT JOIN public."DnaStructure" ds ON ds."structureId" = s."id"
  LEFT JOIN public."Dna" d ON d."id" = ds."dnaId"
GROUP BY
  s."id";
