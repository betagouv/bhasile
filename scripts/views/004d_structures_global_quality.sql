-- Objective: global data quality indicators per structure
-- One row per structure, aggregates all quality indicators from thematic views
--
-- This view aggregates:
-- - structures_calendar_quality: calendar-related indicators (authorization, conventions)
-- - structures_places_quality: places-related indicators (specific places vs authorized)
-- - structures_finance_quality: finance-related indicators (budgets, affectations)
CREATE OR REPLACE VIEW:"SCHEMA"."structures_global_quality" AS
SELECT
  s."dnaCode" AS "dnaCode",
  s.id AS "id",
  o."name" AS "operateur",
  d."region" AS "region",
  s."updatedAt" AS "updatedAt",
  -- Calendar indicators
  COALESCE(cal."has_authorisation_dates_undefined", FALSE) AS "has_authorisation_dates_undefined",
  COALESCE(cal."has_issue_authorisation_period_not_15y", FALSE) AS "has_issue_authorisation_period_not_15y",
  COALESCE(cal."has_convention_dates_undefined", FALSE) AS "has_convention_dates_undefined",
  COALESCE(cal."has_issue_authorized_convention_not_5y", FALSE) AS "has_issue_authorized_convention_not_5y",
  COALESCE(cal."has_issue_authorized_convention_outside_authorisation_period", FALSE) AS "has_issue_authorized_convention_outside_authorisation_period",
  COALESCE(cal."has_issue_subsidized_convention_gt_3y", FALSE) AS "has_issue_subsidized_convention_gt_3y",
  -- Places indicators
  COALESCE(pl."has_issue_specific_places_gt_places_autorisees", FALSE) AS "has_issue_specific_places_gt_places_autorisees",
  COALESCE(pl."has_issue_places_structure_vs_address_diff_gt_10pct", FALSE) AS "has_issue_places_structure_vs_address_diff_gt_10pct",
  -- Finance indicators
  COALESCE(fin."has_issue_taux_encadrement_max_gt_25", FALSE) AS "has_issue_taux_encadrement_max_gt_25",
  COALESCE(fin."has_issue_taux_encadrement_min_lt_15", FALSE) AS "has_issue_taux_encadrement_min_lt_15",
  COALESCE(fin."has_issue_cout_journalier_max_gt_25", FALSE) AS "has_issue_cout_journalier_max_gt_25",
  COALESCE(fin."has_issue_cout_journalier_min_lt_15", FALSE) AS "has_issue_cout_journalier_min_lt_15",
  COALESCE(fin."has_issue_resultat_net_eq_0", FALSE) AS "has_issue_resultat_net_eq_0",
  COALESCE(fin."has_issue_authorized_excedent_affectations_mismatch", FALSE) AS "has_issue_authorized_excedent_affectations_mismatch",
  COALESCE(fin."has_issue_authorized_negative_affectations", FALSE) AS "has_issue_authorized_negative_affectations",
  COALESCE(fin."has_issue_subsidized_deficit_nonzero_boxes", FALSE) AS "has_issue_subsidized_deficit_nonzero_boxes",
  COALESCE(fin."has_issue_subsidized_excedent_rules", FALSE) AS "has_issue_subsidized_excedent_rules",
  -- Count total number of issues (true values)
  (
    (COALESCE(cal."has_authorisation_dates_undefined", FALSE)::int) + (COALESCE(cal."has_issue_authorisation_period_not_15y", FALSE)::int) + (COALESCE(cal."has_convention_dates_undefined", FALSE)::int) + (COALESCE(cal."has_issue_authorized_convention_not_5y", FALSE)::int) + (
      COALESCE(cal."has_issue_authorized_convention_outside_authorisation_period", FALSE)::int
    ) + (COALESCE(cal."has_issue_subsidized_convention_gt_3y", FALSE)::int) + (COALESCE(pl."has_issue_specific_places_gt_places_autorisees", FALSE)::int) + (COALESCE(pl."has_issue_places_structure_vs_address_diff_gt_10pct", FALSE)::int) + (COALESCE(fin."has_issue_taux_encadrement_max_gt_25", FALSE)::int) + (COALESCE(fin."has_issue_taux_encadrement_min_lt_15", FALSE)::int) + (COALESCE(fin."has_issue_cout_journalier_max_gt_25", FALSE)::int) + (COALESCE(fin."has_issue_cout_journalier_min_lt_15", FALSE)::int) + (COALESCE(fin."has_issue_resultat_net_eq_0", FALSE)::int) + (COALESCE(fin."has_issue_authorized_excedent_affectations_mismatch", FALSE)::int) + (COALESCE(fin."has_issue_authorized_negative_affectations", FALSE)::int) + (COALESCE(fin."has_issue_subsidized_deficit_nonzero_boxes", FALSE)::int) + (COALESCE(fin."has_issue_subsidized_excedent_rules", FALSE)::int)
  ) AS "issues_count"
FROM
  public."Structure" s
  LEFT JOIN:"SCHEMA"."structures_calendar_quality" cal ON cal."dnaCode" = s."dnaCode"
  LEFT JOIN:"SCHEMA"."structures_places_quality" pl ON pl."dnaCode" = s."dnaCode"
  LEFT JOIN:"SCHEMA"."structures_finance_quality" fin ON fin."dnaCode" = s."dnaCode"
  LEFT JOIN public."Operateur" o ON o."id" = s."operateurId"
  LEFT JOIN public."Departement" d ON d."numero" = s."departementAdministratif"
  LEFT JOIN public."Form" f ON f."structureCodeDna" = s."dnaCode"
  LEFT JOIN public."FormDefinition" fd ON fd."id" = f."formDefinitionId"
WHERE
  fd."slug" = 'finalisation-v1'
  AND f."status" = TRUE;
