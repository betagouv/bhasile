-- Objective: determine finalisation status per structure based on forms
CREATE OR REPLACE VIEW:"SCHEMA"."structures_filling" AS
WITH
  finalisation_forms AS (
    SELECT
      f."structureId" AS "structureId",
      f."id" AS "formId",
      f."status" AS "formStatus",
      CASE
        WHEN EXISTS (
          SELECT
            1
          FROM
            public."FormStep" fs
          WHERE
            fs."formId" = f."id"
            AND fs."status" = 'VALIDE'
        ) THEN TRUE
        ELSE FALSE
      END AS "hasValidatedStep"
    FROM
      public."Form" f
      INNER JOIN public."FormDefinition" fd ON fd."id" = f."formDefinitionId"
    WHERE
      fd."name" = 'finalisation'
  )
SELECT
  sc."id" AS "id",
  sc."code_bhasile" AS "code_bhasile",
  CASE
    WHEN ff."formId" IS NOT NULL
    AND ff."formStatus" = TRUE THEN 'Finalisé agent'
    WHEN ff."formId" IS NOT NULL
    AND ff."hasValidatedStep" = TRUE THEN 'En cours agent'
    WHEN ff."formId" IS NOT NULL THEN 'Finalisé opérateur'
    ELSE 'Non commencé'
  END AS "finalisation_status_detail",
  CASE
    WHEN ff."formId" IS NOT NULL
    AND ff."formStatus" = TRUE THEN 'Finalisé'
    WHEN ff."formId" IS NOT NULL
    AND ff."hasValidatedStep" = TRUE THEN 'En cours'
    WHEN ff."formId" IS NOT NULL THEN 'En cours'
    ELSE 'Non commencé'
  END AS "finalisation_status",
  sc."operateur" AS "operateur",
  sc."structure_type" AS "structure_type",
  s."public" AS "public",
  sc."region" AS "region",
  sc."created_at" AS "created_at",
  sc."updated_at" AS "updated_at"
FROM
:"SCHEMA"."structures_core" sc
  JOIN public."Structure" s ON s."id" = sc."id"
  LEFT JOIN finalisation_forms ff ON ff."structureId" = s."id";
