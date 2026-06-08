/**
 * Répartition indicateurs qualité → agrégats mensuels (cron).
 * Metabase : indicateurs_utiles_count / indicateurs_impact_count dans reporting_mensuel ;
 * détail par colonne has_issue_* dans MonthlyStructuresGlobalQualityCount.
 *
 * Seuils activité 7 % / 3 % et coût 25 € : à valider avec Émilie.
 */

export const INDICATEURS_UTILES = [
  "has_issue_authorisation_dates_undefined",
  "has_issue_convention_dates_undefined",
  "has_issue_authorized_convention_missing_or_expired",
  "has_issue_evaluation_not_done_in_time",
  "has_issue_multi_dna",
  "has_issue_cpom_mono_structure",
  "has_issue_excedent_left_in_report_a_nouveau",
  "has_issue_missing_convention_document",
  "has_issue_missing_autorisation_document",
  "has_issue_missing_cpom_document",
] as const;

export const INDICATEURS_IMPACT = [
  "has_issue_taux_encadrement_max_gt_threshold", // CADA/CPH > 20, HUDA/CAES > 25
  "has_issue_cout_journalier_max_gt_25",         // TODO: seuil à valider avec Émilie
  "has_issue_places_indisponibles_gt_3pct",
  "has_issue_presences_indues_gt_7pct",          // CADA+HUDA uniquement
  "has_issue_evaluation_not_done_in_time",
] as const;

export const INDICATEURS_NON_CLASSIFIES = [
  "has_issue_dept_code",
  "has_issue_authorisation_period_not_15y",
  "has_issue_authorized_convention_not_5y",
  "has_issue_authorized_convention_outside_authorisation_period",
  "has_issue_subsidized_convention_gt_3y",
  "has_issue_convention_dates_differ_from_actes_administratifs",
  "has_issue_authorisation_dates_differ_from_actes_administratifs",
  "has_issue_specific_places_gt_places_autorisees",
  "has_issue_places_structure_vs_address_diff_gt_10pct",
  "has_issue_taux_encadrement_min_eq_0",
  "has_issue_cout_journalier_max_gt_35",
  "has_issue_cout_journalier_min_lt_15",
  "has_issue_resultat_net_eq_0",
  "has_issue_authorized_affectations_breakdown_missing",
  "has_issue_authorized_reprise_plus_affectations_mismatch",
  "has_issue_subsidized_deficit_nonzero_boxes",
  "has_issue_subsidized_excedent_rules",
] as const;

export const REPORTING_QUALITY_INDICATOR_FIELDS = [
  ...new Set([
    ...INDICATEURS_UTILES,
    ...INDICATEURS_IMPACT,
    ...INDICATEURS_NON_CLASSIFIES,
  ]),
] as const;

export type ReportingQualityIndicatorField =
  (typeof REPORTING_QUALITY_INDICATOR_FIELDS)[number];

export const sumIndicatorCounts = (
  counts: Record<ReportingQualityIndicatorField, number>,
  fields: readonly ReportingQualityIndicatorField[]
): number =>
  fields.reduce((sum, field) => sum + (counts[field] ?? 0), 0);
