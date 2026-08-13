-- Objective: expose anomalies as a flat list, one row per anomaly
--
-- Notes:
-- - Source of truth for the rules is TypeScript (src/lib/anomalies), materialized in
--   public."Anomalie" by the recompute-anomalies script. This view adds no business logic.
-- - Labels and categories are NOT stored: map the code in Metabase.
-- - year = 0 means the anomaly is not tied to a fiscal year, target_id = 0 means it is
--   carried by the structure itself.
CREATE OR REPLACE VIEW:"SCHEMA"."structures_anomalies" AS
SELECT
  a."id" AS "id",
  sc."id" AS "structure_id",
  sc."code_bhasile" AS "code_bhasile",
  sc."operateur" AS "operateur",
  sc."departement_administratif" AS "departement_administratif",
  sc."departement" AS "departement",
  sc."region" AS "region",
  sc."structure_type" AS "structure_type",
  sc."dna_codes" AS "dna_codes",
  a."code"::text AS "code",
  a."year" AS "year",
  a."targetId" AS "target_id",
  a."isJustified" AS "is_justified",
  a."commentaire" AS "commentaire",
  a."justifiedAt" AS "justified_at",
  a."createdAt" AS "created_at",
  a."updatedAt" AS "updated_at"
FROM
  public."Anomalie" a
  INNER JOIN:"SCHEMA"."structures_core" sc ON sc."id" = a."structureId";
