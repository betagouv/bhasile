export type DashboardBlockHeader = {
  title: string;
  icon: string;
};

export const RAPPELS_BLOCK_HEADER: DashboardBlockHeader = {
  title: "Rappels contractualisation et évaluations",
  icon: "ri-list-check-3",
};

export const TRANSFORMATIONS_BLOCK_HEADER: DashboardBlockHeader = {
  title: "Créations, transformations et fermetures de structures",
  icon: "fr-icon-community-line",
};

export const INITIALISATIONS_ACTUALISATIONS_BLOCK_HEADER: DashboardBlockHeader = {
  title: "Initialisations et actualisations de structures",
  icon: "fr-icon-refresh-line",
};

export const ANOMALIES_BLOCK_HEADER: DashboardBlockHeader = {
  title: "Anomalies de données à examiner",
  icon: "fr-icon-search-line",
};
