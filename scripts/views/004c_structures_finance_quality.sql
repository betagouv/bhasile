-- Objective: finance quality indicators per structure
-- One row per structure, boolean columns for finance-related data quality issues
--
-- Notes:
-- - Financial indicators rely on `public."Budget"`
-- - "résultat net" is computed as `totalProduits - totalCharges` (it is not stored in DB)
CREATE OR REPLACE VIEW:"SCHEMA"."structures_finance_quality" AS
WITH
  structures AS (
    SELECT
      s."dnaCode",
      s."type" AS "structureType"
    FROM
      public."Structure" s
  ),
  budgets_enriched AS (
    SELECT
      b."structureDnaCode" AS "dnaCode",
      b."year" AS "year",
      b."totalProduits" AS "totalProduits",
      b."totalCharges" AS "totalCharges",
      -- Résultat net: NULL if both are null, otherwise compute the difference
      CASE
        WHEN b."totalProduits" IS NULL
        AND b."totalCharges" IS NULL THEN NULL
        ELSE COALESCE(b."totalProduits", 0) - COALESCE(b."totalCharges", 0)
      END AS "resultat_net",
      b."repriseEtat" AS "repriseEtat",
      b."excedentRecupere" AS "excedentRecupere",
      b."excedentDeduit" AS "excedentDeduit",
      b."reserveInvestissement" AS "reserveInvestissement",
      b."chargesNonReconductibles" AS "chargesNonReconductibles",
      b."reserveCompensationDeficits" AS "reserveCompensationDeficits",
      b."reserveCompensationBFR" AS "reserveCompensationBFR",
      b."reserveCompensationAmortissements" AS "reserveCompensationAmortissements",
      b."fondsDedies" AS "fondsDedies",
      b."affectationReservesFondsDedies" AS "affectationReservesFondsDedies",
      b."reportANouveau" AS "reportANouveau",
      b."autre" AS "autre",
      -- Sum of affectations: NULL if the sum is 0 (all NULL)
      NULLIF(
        COALESCE(b."excedentRecupere", 0) + COALESCE(b."excedentDeduit", 0) + COALESCE(b."reserveInvestissement", 0) + COALESCE(b."chargesNonReconductibles", 0) + COALESCE(b."reserveCompensationDeficits", 0) + COALESCE(b."reserveCompensationBFR", 0) + COALESCE(b."reserveCompensationAmortissements", 0) + COALESCE(b."fondsDedies", 0) + COALESCE(b."affectationReservesFondsDedies", 0) + COALESCE(b."reportANouveau", 0) + COALESCE(b."autre", 0),
        0
      ) AS "sum_affectations"
    FROM
      public."Budget" b
    WHERE
      b."structureDnaCode" IS NOT NULL
  ),
  budgets_rates AS (
    SELECT
      b."structureDnaCode" AS "dnaCode",
      MAX(b."tauxEncadrement") AS taux_encadrement_max,
      MIN(b."tauxEncadrement") AS taux_encadrement_min,
      MAX(b."coutJournalier") AS cout_journalier_max,
      MIN(b."coutJournalier") AS cout_journalier_min
    FROM
      public."Budget" b
    WHERE
      b."structureDnaCode" IS NOT NULL
    GROUP BY
      b."structureDnaCode"
  ),
  budget_indicators AS (
    SELECT
      s."dnaCode",
      -- Résultat net = 0 is considered an issue (exclut les NULL)
      BOOL_OR(be."resultat_net" = 0) AS "has_issue_resultat_net_eq_0",
      -- Authorized structures: if excedent, then (resultat_net - repriseEtat) should equal sum of affectations
      BOOL_OR(
        s."structureType" IN ('CADA', 'CPH')
        AND be."resultat_net" > 0
        AND be."sum_affectations" IS NOT NULL -- Ignore si affectations sont toutes NULL
        AND ABS((be."resultat_net" - COALESCE(be."repriseEtat", 0)) - be."sum_affectations") > 0.01
      ) AS "has_issue_authorized_excedent_affectations_mismatch",
      -- Authorized structures: sum of affectations should be consistent (not negative)
      BOOL_OR(
        s."structureType" IN ('CADA', 'CPH')
        AND be."sum_affectations" IS NOT NULL -- Ignore si toutes NULL
        AND be."sum_affectations" < 0
      ) AS "has_issue_authorized_negative_affectations",
      -- Subsidized structures: deficit => all affectation buckets should be 0 or NULL except deficit compensation
      BOOL_OR(
        s."structureType" IN ('HUDA', 'CAES')
        AND be."resultat_net" < 0
        AND (
          (COALESCE(be."excedentRecupere", 0) <> 0)
          OR (COALESCE(be."excedentDeduit", 0) <> 0)
          OR (COALESCE(be."reserveInvestissement", 0) <> 0)
          OR (COALESCE(be."chargesNonReconductibles", 0) <> 0)
          OR (COALESCE(be."reserveCompensationBFR", 0) <> 0)
          OR (COALESCE(be."reserveCompensationAmortissements", 0) <> 0)
          OR (COALESCE(be."fondsDedies", 0) <> 0)
          OR (COALESCE(be."affectationReservesFondsDedies", 0) <> 0)
          OR (COALESCE(be."reportANouveau", 0) <> 0)
          OR (COALESCE(be."autre", 0) <> 0)
        )
      ) AS "has_issue_subsidized_deficit_nonzero_boxes",
      -- Subsidized structures: excedent => deficit compensation must be 0/NULL and
      -- (excedentRecupere + excedentDeduit + fondsDedies) should equal resultat_net
      BOOL_OR(
        s."structureType" IN ('HUDA', 'CAES')
        AND be."resultat_net" > 0
        AND (
          COALESCE(be."reserveCompensationDeficits", 0) <> 0
          OR ABS(
            (
              COALESCE(be."excedentRecupere", 0) + COALESCE(be."excedentDeduit", 0) + COALESCE(be."fondsDedies", 0)
            ) - be."resultat_net"
          ) > 0.01
        )
      ) AS "has_issue_subsidized_excedent_rules"
    FROM
      structures s
      LEFT JOIN budgets_enriched be ON be."dnaCode" = s."dnaCode"
    GROUP BY
      s."dnaCode"
  )
SELECT
  s."dnaCode" AS "dnaCode",
  -- Budget rates: taux d'encadrement and coût journalier should be between 15 and 25
  COALESCE(br."taux_encadrement_max" > 25, FALSE) AS "has_issue_taux_encadrement_max_gt_25",
  COALESCE(br."taux_encadrement_min" < 15, FALSE) AS "has_issue_taux_encadrement_min_lt_15",
  COALESCE(br."cout_journalier_max" > 25, FALSE) AS "has_issue_cout_journalier_max_gt_25",
  COALESCE(br."cout_journalier_min" < 15, FALSE) AS "has_issue_cout_journalier_min_lt_15",
  -- Budget indicators (aggregated from multiple years)
  COALESCE(bi."has_issue_resultat_net_eq_0", FALSE) AS "has_issue_resultat_net_eq_0",
  COALESCE(bi."has_issue_authorized_excedent_affectations_mismatch", FALSE) AS "has_issue_authorized_excedent_affectations_mismatch",
  COALESCE(bi."has_issue_authorized_negative_affectations", FALSE) AS "has_issue_authorized_negative_affectations",
  COALESCE(bi."has_issue_subsidized_deficit_nonzero_boxes", FALSE) AS "has_issue_subsidized_deficit_nonzero_boxes",
  COALESCE(bi."has_issue_subsidized_excedent_rules", FALSE) AS "has_issue_subsidized_excedent_rules"
FROM
  structures s
  LEFT JOIN budget_indicators bi ON bi."dnaCode" = s."dnaCode"
  LEFT JOIN budgets_rates br ON br."dnaCode" = s."dnaCode";
