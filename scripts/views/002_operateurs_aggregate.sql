-- Objective: aggregate all the data for the operateurs
CREATE OR REPLACE VIEW:"SCHEMA"."operateurs_aggregates" AS
SELECT
  o."id",
  o."name",
  o."directionGenerale",
  o."siegeSocial",
  o."siret",
  o."createdAt",
  o."updatedAt",
  COUNT(DISTINCT s."id") AS "nb_structures",
  SUM(sa."places_autorisees_structure") AS "places_autorisees_structure",
  SUM(sa."pmr_structure") AS "pmr_structure",
  SUM(sa."lgbt_structure") AS "lgbt_structure",
  SUM(sa."fvv_teh_structure") AS "fvv_teh_structure",
  SUM(sa."places_autorisees_adresse") AS "places_autorisees_adresse",
  SUM(sa."qpv_adresse") AS "qpv_adresse",
  SUM(sa."logement_social_adresse") AS "logement_social_adresse"
FROM
  public."Operateur" o
  LEFT JOIN public."Structure" s ON s."operateurId" = o."id"
  LEFT JOIN:"SCHEMA"."structures_aggregates" sa ON sa."id" = s."id"
GROUP BY
  o."id",
  o."name",
  o."directionGenerale",
  o."siegeSocial",
  o."siret",
  o."createdAt",
  o."updatedAt";
