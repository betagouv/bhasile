-- Objective: characteristics quality indicators per structure
-- One row per structure, boolean columns for characteristics-related data quality issues
--
-- Issue: DNA code incoherent with departement
CREATE OR REPLACE VIEW:"SCHEMA"."structures_characteristics_quality" AS
SELECT
  s."dnaCode" AS "dnaCode",
  (
    SUBSTRING(
      s."dnaCode"
      FROM
        2 FOR LENGTH(TRIM(s."departementAdministratif"))
    ) <> TRIM(s."departementAdministratif")
  ) AS "has_issue_dept_code"
FROM
  public."Structure" s;
