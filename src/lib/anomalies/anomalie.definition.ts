import type {
  AnomalieCategorie,
  AnomalieCible,
  AnomalieCode,
} from "@/types/anomalie.type";

// Source de vérité du registre. `isDisplayed` gouverne l'affichage front ; les règles à
// false sont calculées et persistées quand même, pour le reporting.
export const ANOMALIE_DEFINITIONS: Record<AnomalieCode, AnomalieDefinition> = {
  AUTORISATION_DUREE_NOT_15Y: {
    label:
      "La période d’autorisation doit être de 15 ans pour une structure autorisée",
    categorie: "CALENDRIER",
    cible: "ACTE_ADMINISTRATIF",
    champsCibles: ["startDate", "endDate"],
    isDisplayed: true,
  },
  CONVENTION_AUTORISEE_DUREE_NOT_5Y: {
    label:
      "La durée d’une convention doit être de 5 ans pour une structure autorisée",
    categorie: "CALENDRIER",
    cible: "ACTE_ADMINISTRATIF",
    champsCibles: ["startDate", "endDate"],
    isDisplayed: true,
  },
  CONVENTION_SUBVENTIONNEE_DUREE_GT_3Y: {
    label:
      "Les conventions des structures subventionnées ne doivent pas excéder 3 ans",
    categorie: "CALENDRIER",
    cible: "ACTE_ADMINISTRATIF",
    champsCibles: ["startDate", "endDate"],
    isDisplayed: true,
  },
  CONVENTION_HORS_PERIODE_AUTORISATION: {
    label:
      "Les dates de convention doivent se situer dans l’intervalle des dates d’autorisation",
    categorie: "CALENDRIER",
    cible: "ACTE_ADMINISTRATIF",
    champsCibles: ["startDate", "endDate"],
    isDisplayed: true,
  },
  CONVENTION_MANQUANTE_OU_EXPIREE: {
    label: "Aucune convention en cours n’est renseignée",
    categorie: "CALENDRIER",
    cible: "STRUCTURE",
    champsCibles: [],
    isDisplayed: false,
  },
  CONVENTION_DATES_DIFFERENTES_ACTES: {
    label:
      "Les dates de convention de la structure diffèrent de celles des actes administratifs",
    categorie: "CALENDRIER",
    cible: "STRUCTURE",
    champsCibles: ["debutConvention", "finConvention"],
    isDisplayed: false,
  },
  AUTORISATION_DATES_DIFFERENTES_ACTES: {
    label:
      "Les dates d’autorisation de la structure diffèrent de celles des actes administratifs",
    categorie: "CALENDRIER",
    cible: "STRUCTURE",
    champsCibles: ["debutPeriodeAutorisation", "finPeriodeAutorisation"],
    isDisplayed: false,
  },
  EVALUATION_HORS_DELAI: {
    label: "L’évaluation doit être réalisée au moins tous les 5 ans",
    categorie: "CALENDRIER",
    cible: "STRUCTURE",
    champsCibles: [],
    isDisplayed: false,
  },

  PLACES_LABELLISEES_GT_AUTORISEES: {
    label:
      "Le nombre de places labellisées (LGBT) doit être inférieur ou égal au nombre de places autorisées total",
    categorie: "PLACES",
    cible: "STRUCTURE",
    champsCibles: ["lgbt"],
    isDisplayed: true,
  },
  PLACES_SPECIALISEES_GT_AUTORISEES: {
    label:
      "Le nombre de places spécialisées (FVV/TEH) doit être inférieur ou égal au nombre de places autorisées total",
    categorie: "PLACES",
    cible: "STRUCTURE",
    champsCibles: ["fvvTeh"],
    isDisplayed: false,
  },
  PLACES_PMR_GT_AUTORISEES: {
    label:
      "Le nombre de places PMR doit être inférieur ou égal au nombre de places autorisées total",
    categorie: "PLACES",
    cible: "STRUCTURE",
    champsCibles: ["pmr"],
    isDisplayed: false,
  },
  INCOHERENCE_LGBT_PLACES: {
    label:
      "L’indicateur LGBT de la structure est incohérent avec le nombre de places LGBT renseigné",
    categorie: "PLACES",
    cible: "STRUCTURE",
    champsCibles: ["lgbt"],
    isDisplayed: false,
  },
  INCOHERENCE_FVVTEH_PLACES: {
    label:
      "L’indicateur FVV/TEH de la structure est incohérent avec le nombre de places FVV/TEH renseigné",
    categorie: "PLACES",
    cible: "STRUCTURE",
    champsCibles: ["fvvTeh"],
    isDisplayed: false,
  },
  PLACES_ADRESSES_ECART_STRUCTURE: {
    label:
      "Il y a un écart de plus de 10 % entre le nombre de places autorisées total et la somme des places aux adresses d’hébergement",
    categorie: "PLACES",
    cible: "STRUCTURE",
    champsCibles: ["placesAutorisees"],
    isDisplayed: true,
  },

  DEPARTEMENT_INCOHERENT_CODE_DNA: {
    label: "Le département de la structure est incohérent avec son code DNA",
    categorie: "CARACTERISTIQUES",
    cible: "DNA",
    champsCibles: ["departementAdministratif"],
    isDisplayed: false,
  },
  MULTI_DNA: {
    label: "La structure est rattachée à plusieurs codes DNA",
    categorie: "CARACTERISTIQUES",
    cible: "STRUCTURE",
    champsCibles: [],
    isDisplayed: false,
  },
  CPOM_MONO_STRUCTURE: {
    label: "La structure est rattachée à un CPOM qui ne contient qu’elle",
    categorie: "CARACTERISTIQUES",
    cible: "CPOM",
    champsCibles: [],
    isDisplayed: false,
  },

  TAUX_ENCADREMENT_GT_SEUIL: {
    label:
      "Le taux d’encadrement dépasse le seuil attendu pour ce type de structure",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["tauxEncadrement"],
    isDisplayed: false,
  },
  TAUX_ENCADREMENT_LT_2: {
    label: "Le taux d’encadrement est à 0 ou anormalement bas (< 2)",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["tauxEncadrement"],
    isDisplayed: true,
  },
  COUT_JOURNALIER_GT_TARIF_CIBLE: {
    label:
      "Le coût journalier dépasse le tarif cible pour ce type de structure",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["coutJournalier"],
    isDisplayed: false,
  },
  COUT_JOURNALIER_LT_15: {
    label: "Le coût journalier est inférieur à 15 €",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["coutJournalier"],
    isDisplayed: false,
  },
  RESULTAT_NET_EQ_0: {
    label:
      "Le résultat net est égal à zéro ce qui paraît anormal (dépenses rarement strictement égales aux recettes)",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["totalProduits", "totalCharges"],
    isDisplayed: true,
  },
  AFFECTATION_DETAIL_MANQUANT: {
    label:
      "Un montant d’affectation global a été saisi mais pas sa répartition dans les différentes réserves",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["affectationReservesFondsDedies"],
    isDisplayed: true,
  },
  AFFECTATION_DETAIL_ECART: {
    label:
      "La somme des montants dans le détail des affectations doit être strictement égale au montant d’affectation global",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: [
      "reserveInvestissement",
      "chargesNonReconductibles",
      "reserveCompensationDeficits",
      "reserveCompensationBFR",
      "reserveCompensationAmortissements",
      "reportANouveau",
      "autre",
    ],
    isDisplayed: true,
  },
  REPRISE_PLUS_AFFECTATION_ECART: {
    label:
      "Le résultat net doit être strictement égal à la somme entre Affectation et Reprise État en valeur absolue",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["repriseEtat", "affectationReservesFondsDedies"],
    isDisplayed: true,
  },
  REPRISE_ETAT_SIGNE_INVERSE: {
    label: "Le signe de la reprise État semble inversé",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["repriseEtat"],
    isDisplayed: false,
  },
  SUBVENTIONNEE_DEFICIT_AVEC_EXCEDENT: {
    label:
      "La structure est déficitaire mais un excédent récupéré ou réemployé a été renseigné",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["excedentRecupere", "excedentDeduit", "fondsDedies"],
    isDisplayed: true,
  },
  SUBVENTIONNEE_EXCEDENT_AVEC_REPRISE_ETAT: {
    label:
      "La structure est excédentaire mais une reprise État a été renseignée",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["repriseEtat"],
    isDisplayed: false,
  },
  SUBVENTIONNEE_EXCEDENT_ECART: {
    label:
      "La somme des excédents récupérés, déduits et des fonds dédiés doit être égale au résultat net",
    categorie: "FINANCE",
    cible: "STRUCTURE",
    champsCibles: ["excedentRecupere", "excedentDeduit", "fondsDedies"],
    isDisplayed: false,
  },

  DOCUMENT_CONVENTION_MANQUANT: {
    label: "Aucun document n’est rattaché à la convention",
    categorie: "DOCUMENTS",
    cible: "STRUCTURE",
    champsCibles: [],
    isDisplayed: false,
  },
  DOCUMENT_AUTORISATION_MANQUANT: {
    label: "Aucun document n’est rattaché à l’arrêté d’autorisation",
    categorie: "DOCUMENTS",
    cible: "STRUCTURE",
    champsCibles: [],
    isDisplayed: false,
  },
  DOCUMENT_CPOM_MANQUANT: {
    label: "Aucun document n’est rattaché à la convention du CPOM",
    categorie: "DOCUMENTS",
    cible: "CPOM",
    champsCibles: [],
    isDisplayed: false,
  },

  ACTIVITE_PLACES_INDISPONIBLES_GT_3PCT: {
    label: "Les places indisponibles dépassent 3 % des places autorisées",
    categorie: "ACTIVITE",
    cible: "STRUCTURE",
    champsCibles: [],
    isDisplayed: false,
  },
  ACTIVITE_PRESENCES_INDUES_GT_7PCT: {
    label: "Les présences indues dépassent 7 % des places autorisées",
    categorie: "ACTIVITE",
    cible: "STRUCTURE",
    champsCibles: [],
    isDisplayed: false,
  },
};

export type AnomalieDefinition = {
  label: string;
  categorie: AnomalieCategorie;
  cible: AnomalieCible;
  champsCibles: string[];
  isDisplayed: boolean;
};
