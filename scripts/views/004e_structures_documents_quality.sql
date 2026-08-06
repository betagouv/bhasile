-- Objective: documents quality indicators per structure
-- One row per structure, boolean columns for missing administrative documents
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
  sc."id" AS "id",
  NOT EXISTS (
    SELECT
      1
    FROM
      acte_with_file awf
    WHERE
      awf."structureId" = sc."id"
      AND awf."category" = 'CONVENTION'
  ) AS "has_issue_missing_convention_document",
  CASE
    WHEN sc."structure_type" IN ('CADA', 'CPH') THEN NOT EXISTS (
      SELECT
        1
      FROM
        acte_with_file awf
      WHERE
        awf."structureId" = sc."id"
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
        cs."structureId" = sc."id"
        AND NOT EXISTS (
          SELECT
            1
          FROM
            acte_with_file awf
          WHERE
            awf."cpomId" = cs."cpomId"
            AND awf."category" = 'CONVENTION_CPOM'
        )
    ),
    FALSE
  ) AS "has_issue_missing_cpom_document"
FROM
:"SCHEMA"."structures_core" sc;
