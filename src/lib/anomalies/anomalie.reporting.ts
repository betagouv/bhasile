import type { AnomalieCode } from "@/types/anomalie.type";

// Correspondance entre les colonnes historiques de reporting.structures_global_quality et
// les codes du registre. La vue 004z est écrite à partir de cette table ; le test de garde
// interdit qu'un code soit ajouté sans être reporté dans la vue.
export const COLONNES_REPORTING_QUALITE: Record<string, AnomalieCode[]> = {
  has_issue_authorisation_period_not_15y: ["AUTORISATION_DUREE_NOT_15Y"],
  has_issue_authorized_convention_not_5y: ["CONVENTION_AUTORISEE_DUREE_NOT_5Y"],
  has_issue_authorized_convention_outside_authorisation_period: [
    "CONVENTION_HORS_PERIODE_AUTORISATION",
  ],
  has_issue_authorized_convention_missing_or_expired: [
    "CONVENTION_MANQUANTE_OU_EXPIREE",
  ],
  has_issue_convention_dates_differ_from_actes_administratifs: [
    "CONVENTION_DATES_DIFFERENTES_ACTES",
  ],
  has_issue_authorisation_dates_differ_from_actes_administratifs: [
    "AUTORISATION_DATES_DIFFERENTES_ACTES",
  ],
  has_issue_evaluation_not_done_in_time: ["EVALUATION_HORS_DELAI"],
  has_issue_subsidized_convention_gt_3y: [
    "CONVENTION_SUBVENTIONNEE_DUREE_GT_3Y",
  ],
  has_issue_specific_places_gt_places_autorisees: [
    "PLACES_LABELLISEES_GT_AUTORISEES",
    "PLACES_SPECIALISEES_GT_AUTORISEES",
    "PLACES_PMR_GT_AUTORISEES",
  ],
  has_issue_incoherence_lgbt_places: ["INCOHERENCE_LGBT_PLACES"],
  has_issue_incoherence_fvvteh_places: ["INCOHERENCE_FVVTEH_PLACES"],
  has_issue_places_structure_vs_address_diff_gt_10pct: [
    "PLACES_ADRESSES_ECART_STRUCTURE",
  ],
  has_issue_dept_code: ["DEPARTEMENT_INCOHERENT_CODE_DNA"],
  has_issue_multi_dna: ["MULTI_DNA"],
  has_issue_cpom_mono_structure: ["CPOM_MONO_STRUCTURE"],
  has_issue_taux_encadrement_max_gt_threshold: ["TAUX_ENCADREMENT_GT_SEUIL"],
  has_issue_taux_encadrement_min_lt_2: ["TAUX_ENCADREMENT_LT_2"],
  has_issue_cout_journalier_max_gt_tarif_cible: [
    "COUT_JOURNALIER_GT_TARIF_CIBLE",
  ],
  has_issue_cout_journalier_min_lt_15: ["COUT_JOURNALIER_LT_15"],
  has_issue_resultat_net_eq_0: ["RESULTAT_NET_EQ_0"],
  has_issue_authorized_affectations_breakdown_missing: [
    "AFFECTATION_DETAIL_MANQUANT",
  ],
  has_issue_authorized_affectations_breakdown_mismatch: [
    "AFFECTATION_DETAIL_ECART",
  ],
  has_issue_authorized_reprise_plus_affectations_mismatch: [
    "REPRISE_PLUS_AFFECTATION_ECART",
  ],
  has_issue_authorized_reprise_wrong_sign: ["REPRISE_ETAT_SIGNE_INVERSE"],
  has_issue_subsidized_deficit_nonzero_boxes: [
    "SUBVENTIONNEE_DEFICIT_AVEC_EXCEDENT",
  ],
  has_issue_subsidized_excedent_reprise_etat_nonzero: [
    "SUBVENTIONNEE_EXCEDENT_AVEC_REPRISE_ETAT",
  ],
  has_issue_subsidized_excedent_rules: ["SUBVENTIONNEE_EXCEDENT_ECART"],
  has_issue_missing_convention_document: ["DOCUMENT_CONVENTION_MANQUANT"],
  has_issue_missing_autorisation_document: ["DOCUMENT_AUTORISATION_MANQUANT"],
  has_issue_missing_cpom_document: ["DOCUMENT_CPOM_MANQUANT"],
  has_issue_places_indisponibles_gt_3pct: [
    "ACTIVITE_PLACES_INDISPONIBLES_GT_3PCT",
  ],
  has_issue_presences_indues_gt_7pct: ["ACTIVITE_PRESENCES_INDUES_GT_7PCT"],
};
