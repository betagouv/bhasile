-- Objective: surface structures whose history is partially flagged as "missing"
-- One row per structure, boolean columns for each entity that can carry an `isMissing` flag.
-- Companion to the quality views (004x): rows flagged as missing are excluded from
-- quality computations, so this view helps locate them quickly in dashboards.
--
-- Entities tracked (`isMissing` flag on each):
-- - ActeAdministratif
-- - Budget
-- - DocumentFinancier
-- - IndicateurFinancier
CREATE OR REPLACE VIEW:"SCHEMA"."structures_missing_history" AS
WITH
  missing_actes_administratifs AS (
    SELECT DISTINCT
      aa."structureId" AS "structureId"
    FROM
      public."ActeAdministratif" aa
    WHERE
      aa."structureId" IS NOT NULL
      AND aa."isMissing" = TRUE
  ),
  missing_budgets AS (
    SELECT DISTINCT
      b."structureId" AS "structureId"
    FROM
      public."Budget" b
    WHERE
      b."structureId" IS NOT NULL
      AND b."isMissing" = TRUE
  ),
  missing_documents_financiers AS (
    SELECT DISTINCT
      df."structureId" AS "structureId"
    FROM
      public."DocumentFinancier" df
    WHERE
      df."structureId" IS NOT NULL
      AND df."isMissing" = TRUE
  ),
  missing_indicateurs_financiers AS (
    SELECT DISTINCT
      i."structureId" AS "structureId"
    FROM
      public."IndicateurFinancier" i
    WHERE
      i."structureId" IS NOT NULL
      AND i."isMissing" = TRUE
  )
SELECT
  sc."id" AS "id",
  sc."code_bhasile" AS "code_bhasile",
  sc."operateur" AS "operateur",
  sc."departement_administratif" AS "departement_administratif",
  sc."departement" AS "departement",
  sc."region" AS "region",
  sc."dna_codes" AS "dna_codes",
  (maa."structureId" IS NOT NULL) AS "has_missing_acte_administratif",
  (mb."structureId" IS NOT NULL) AS "has_missing_budget",
  (mdf."structureId" IS NOT NULL) AS "has_missing_document_financier",
  (mif."structureId" IS NOT NULL) AS "has_missing_indicateur_financier",
  (
    maa."structureId" IS NOT NULL
    OR mb."structureId" IS NOT NULL
    OR mdf."structureId" IS NOT NULL
    OR mif."structureId" IS NOT NULL
  ) AS "has_any_missing"
FROM
:"SCHEMA"."structures_core" sc
  LEFT JOIN missing_actes_administratifs maa ON maa."structureId" = sc."id"
  LEFT JOIN missing_budgets mb ON mb."structureId" = sc."id"
  LEFT JOIN missing_documents_financiers mdf ON mdf."structureId" = sc."id"
  LEFT JOIN missing_indicateurs_financiers mif ON mif."structureId" = sc."id";
