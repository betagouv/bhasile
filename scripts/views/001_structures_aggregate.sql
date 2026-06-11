-- Objective: aggregate indicators per structure
-- Versioned relations (typologies, adresses, DNA links) and scalars (type, public,
-- latitude, longitude) are resolved through the current version of each structure.
CREATE OR REPLACE VIEW:"SCHEMA"."structures_aggregates" AS
WITH -- Last typology by structure (current version)
  structure_typologie_dernier_millesime AS (
    SELECT DISTINCT
      ON (scv."structureId") scv."structureId" AS "structureId",
      st."placesAutorisees",
      st."pmr",
      st."lgbt",
      st."fvvTeh",
      st."year"
    FROM
:"SCHEMA"."structures_current_version" scv
      JOIN public."StructureTypologie" st ON st."structureVersionId" = scv."version_id"
    ORDER BY
      scv."structureId",
      st."year" DESC
  ),
  -- Last typology by address (current version)
  adresse_typologie_dernier_millesime AS (
    SELECT DISTINCT
      ON (aty."adresseId") scv."structureId" AS "structureId",
      a."id" AS "adresse_id",
      aty."placesAutorisees",
      aty."qpv",
      aty."logementSocial",
      aty."year"
    FROM
:"SCHEMA"."structures_current_version" scv
      JOIN public."Adresse" a ON a."structureVersionId" = scv."version_id"
      JOIN public."AdresseTypologie" aty ON aty."adresseId" = a."id"
    ORDER BY
      aty."adresseId",
      aty."year" DESC
  ),
  -- Last activite by dnaCode (Activite is linked to Dna via dnaCode)
  activite_dernier_millesime_par_dna AS (
    SELECT DISTINCT
      ON (a."dnaCode") a."dnaCode",
      a."date",
      a."placesAutorisees"
    FROM
      public."Activite" a
    WHERE
      a."dnaCode" IS NOT NULL
    ORDER BY
      a."dnaCode",
      a."date" DESC
  ),
  -- Aggregate last activites per structure across the current version's DNAs
  activite_dernier_millesime_par_structure AS (
    SELECT
      scv."structureId" AS "structureId",
      MAX(ad."date") AS "date",
      SUM(ad."placesAutorisees") AS "placesAutorisees"
    FROM
      activite_dernier_millesime_par_dna ad
      JOIN public."Dna" d ON d."code" = ad."dnaCode"
      JOIN public."DnaStructure" ds ON ds."dnaId" = d."id"
      JOIN:"SCHEMA"."structures_current_version" scv ON scv."version_id" = ds."structureVersionId"
    GROUP BY
      scv."structureId"
  ),
  -- Aggregate by structure on the last typologies of addresses
  adresses_agregees AS (
    SELECT
      adm."structureId",
      COUNT(DISTINCT adm."adresse_id") AS nb_adresses,
      SUM(adm."placesAutorisees") AS places_autorisees_adresse,
      SUM(adm."qpv") AS qpv_adresse,
      SUM(adm."logementSocial") AS logement_social_adresse,
      MAX(adm."year") AS year_adresse
    FROM
      adresse_typologie_dernier_millesime adm
    GROUP BY
      adm."structureId"
  ),
  -- Keep one financial indicator row per structure/year: REALISE first, PREVISIONNEL fallback
  indicateurs_financiers_filtered AS (
    SELECT DISTINCT
      ON (i."structureId", i."year") i.*
    FROM
      public."IndicateurFinancier" i
    WHERE
      i."structureId" IS NOT NULL
      AND i."isMissing" IS NOT TRUE
    ORDER BY
      i."structureId",
      i."year",
      CASE
        WHEN i."type" = 'REALISE' THEN 0
        ELSE 1
      END
  ),
  -- Last dotationAccordee by structure (most recent budget)
  budget_dernier_millesime AS (
    SELECT DISTINCT
      ON (b."structureId") b."structureId",
      b."dotationAccordee"
    FROM
      public."Budget" b
    WHERE
      b."isMissing" IS NOT TRUE
    ORDER BY
      b."structureId",
      b."year" DESC
  ),
  -- Aggregate budgets by structure
  budgets_agreges AS (
    SELECT
      i."structureId",
      MAX(i."tauxEncadrement") AS taux_encadrement_max,
      MIN(i."tauxEncadrement") AS taux_encadrement_min,
      MAX(i."coutJournalier") AS cout_journalier_max,
      MIN(i."coutJournalier") AS cout_journalier_min,
      COALESCE(
        COALESCE((MAX(i."tauxEncadrement") > 25)::int, 1) + COALESCE((MIN(i."tauxEncadrement") < 15)::int, 1) + COALESCE((MAX(i."coutJournalier") > 25)::int, 1) + COALESCE((MIN(i."coutJournalier") < 15)::int, 1),
        0
      ) AS "indicateurs_budgetaires"
    FROM
      indicateurs_financiers_filtered i
    GROUP BY
      i."structureId"
  ),
  -- Calculs agrégés avec différences et pourcentages
  places_agregees AS (
    SELECT
      s."id",
      sdm."placesAutorisees" AS places_autorisees_structure,
      aa."places_autorisees_adresse",
      adm."placesAutorisees" AS nb_places_activite,
      -- Differences and percentages
      COALESCE(sdm."placesAutorisees", 0) - COALESCE(aa."places_autorisees_adresse", 0) AS diff_places_adresse,
      COALESCE(
        ABS(
          COALESCE(sdm."placesAutorisees", 0) - COALESCE(aa."places_autorisees_adresse", 0)
        ) / NULLIF(COALESCE(sdm."placesAutorisees", 0)::float, 0) * 100,
        0
      ) AS pct_diff_places_adresse,
      COALESCE(adm."placesAutorisees", 0) - COALESCE(sdm."placesAutorisees", 0) AS diff_places_activite,
      COALESCE(
        ABS(COALESCE(adm."placesAutorisees", 0) - COALESCE(sdm."placesAutorisees", 0)) / NULLIF(COALESCE(adm."placesAutorisees", 0)::float, 0) * 100,
        0
      ) AS pct_diff_places_activite
    FROM
      public."Structure" s
      LEFT JOIN structure_typologie_dernier_millesime sdm ON sdm."structureId" = s."id"
      LEFT JOIN adresses_agregees aa ON aa."structureId" = s."id"
      LEFT JOIN activite_dernier_millesime_par_structure adm ON adm."structureId" = s."id"
  ),
  places_agregees_indicateurs AS (
    SELECT
      p."id",
      COALESCE((pct_diff_places_adresse > 10)::int, 0) + COALESCE((pct_diff_places_activite > 10)::int, 0) AS indicateurs_places_agregees
    FROM
      places_agregees p
  )
SELECT
  sc."id" AS "id",
  sc."codeBhasile" AS "codeBhasile",
  sc."operateur" AS "operateur",
  sv.latitude AS "latitude",
  sv.longitude AS "longitude",
  sv.public AS "public",
  sv.type AS "type",
  sc."region" AS "region",
  sc."departement" AS "departement",
  sc."departementAdministratif" AS "departementAdministratif",
  sc."dna_codes" AS "dna_codes",
  pa.places_autorisees_structure AS "places_autorisees_structure",
  sdm."pmr" AS "pmr_structure",
  sdm."lgbt" AS "lgbt_structure",
  sdm."fvvTeh" AS "fvv_teh_structure",
  aa."places_autorisees_adresse" AS "places_autorisees_adresse",
  aa."qpv_adresse" AS "qpv_adresse",
  aa."logement_social_adresse" AS "logement_social_adresse",
  aa."year_adresse" AS "year_adresse",
  aa."nb_adresses" AS "nb_adresses",
  sdm."year" AS "year_structure",
  pa.nb_places_activite AS "nb_places_activite",
  pa.diff_places_adresse AS "diff_places_adresse",
  pa.pct_diff_places_adresse AS "pct_diff_places_adresse",
  pa.diff_places_activite AS "diff_places_activite",
  pa.pct_diff_places_activite AS "pct_diff_places_activite",
  COALESCE(pai."indicateurs_places_agregees", 5) AS "indicateurs_places_agregees",
  ba."taux_encadrement_max" AS "taux_encadrement_max",
  ba."taux_encadrement_min" AS "taux_encadrement_min",
  ba."cout_journalier_max" AS "cout_journalier_max",
  ba."cout_journalier_min" AS "cout_journalier_min",
  COALESCE(ba."indicateurs_budgetaires", 5) AS "indicateurs_budgetaires",
  COALESCE(pai."indicateurs_places_agregees", 5) + COALESCE(ba."indicateurs_budgetaires", 5) AS "indicateurs_structure",
  bdm."dotationAccordee" AS "dotation_accordee_derniere_annee",
  s."createdAt" AS "created_at",
  s."updatedAt" AS "updated_at"
FROM
:"SCHEMA"."structures_core" sc
  JOIN public."Structure" s ON s."id" = sc."id"
  LEFT JOIN:"SCHEMA"."structures_current_version" scv ON scv."structureId" = s."id"
  LEFT JOIN public."StructureVersion" sv ON sv."id" = scv."version_id"
  LEFT JOIN places_agregees pa ON pa."id" = s."id"
  LEFT JOIN structure_typologie_dernier_millesime sdm ON sdm."structureId" = s."id"
  LEFT JOIN adresses_agregees aa ON aa."structureId" = s."id"
  LEFT JOIN places_agregees_indicateurs pai ON pai."id" = s."id"
  LEFT JOIN budgets_agreges ba ON ba."structureId" = s."id"
  LEFT JOIN budget_dernier_millesime bdm ON bdm."structureId" = s."id";
