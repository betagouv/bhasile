-- Objective: documents quality indicators per structure
-- One row per structure, boolean columns for missing administrative documents
--
-- Notes:
-- - Document presence: acte administratif principal (parentId IS NULL) with uploaded file, not flagged isMissing
-- - Autorisation document required only for authorized structure types (CADA, CPH)
-- - CPOM document required when the structure belongs to at least one CPOM (convention on the CPOM)
CREATE OR REPLACE VIEW:"SCHEMA"."structures_documents_quality" AS
WITH
  acte_with_file AS (
    SELECT DISTINCT
      aa."structureId",
      aa."cpomId",
      aa."category"
    FROM
      public."ActeAdministratif" aa
      INNER JOIN public."FileUpload" fu ON fu."acteAdministratifId" = aa."id"
    WHERE
      aa."parentId" IS NULL
      AND COALESCE(aa."isMissing", FALSE) = FALSE
  )
SELECT
  s."id" AS "id",
  NOT EXISTS (
    SELECT
      1
    FROM
      acte_with_file awf
    WHERE
      awf."structureId" = s."id"
      AND awf."category" = 'CONVENTION'
  ) AS "has_issue_missing_convention_document",
  CASE
    WHEN s."type" IN ('CADA', 'CPH') THEN NOT EXISTS (
      SELECT
        1
      FROM
        acte_with_file awf
      WHERE
        awf."structureId" = s."id"
        AND awf."category" = 'ARRETE_AUTORISATION'
    )
    ELSE FALSE
  END AS "has_issue_missing_autorisation_document",
  COALESCE(
    EXISTS (
      SELECT
        1
      FROM
        public."CpomStructure" cs
      WHERE
        cs."structureId" = s."id"
        AND NOT EXISTS (
          SELECT
            1
          FROM
            acte_with_file awf
          WHERE
            awf."cpomId" = cs."cpomId"
            AND awf."category" = 'CONVENTION'
        )
    ),
    FALSE
  ) AS "has_issue_missing_cpom_document"
FROM
  public."Structure" s;
