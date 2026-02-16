/**
 * Common selectors used across e2e tests
 * Centralized to avoid duplication and make maintenance easier
 */
export const SELECTORS = {
  // Form elements
  SUBMIT_BUTTON: 'button[type="submit"]',
  FILE_INPUT: 'input[type="file"]',

  // Autocomplete
  AUTCOMPLETE_OPTION: '[role="option"]',
  AUTCOMPLETE_SUGGESTION: "#suggestion-0",

  // Checkboxes
  CHECKBOX_BY_VALUE: (value: string) =>
    `input[type="checkbox"][value="${value}"]`,
  CHECKBOX_BY_NAME: (name: string) => `input[name="${name}"]`,

  // Common form fields
  FILIALE_TOGGLE: "#managed-by-a-filiale-input",
  FILIALE_INPUT: "#filiale",
  PUBLIC_SELECT: "#public",
  DEPARTEMENT_INPUT: "#departement",

  // Address fields
  ADRESSE_ADMINISTRATIVE_COMPLETE:
    'input[name="adresseAdministrativeComplete"]',
  ADRESSE_COMPLETE: (index: number) =>
    `input[name="adresses.${index}.adresseComplete"]`,

  // Contact fields
  CONTACT_PRINCIPAL: {
    PRENOM: 'input[name="contactPrincipal.prenom"]',
    NOM: 'input[name="contactPrincipal.nom"]',
    ROLE: 'input[name="contactPrincipal.role"]',
    EMAIL: 'input[name="contactPrincipal.email"]',
    TELEPHONE: 'input[name="contactPrincipal.telephone"]',
  },
  CONTACT_SECONDAIRE: {
    PRENOM: 'input[name="contactSecondaire.prenom"]',
    NOM: 'input[name="contactSecondaire.nom"]',
    ROLE: 'input[name="contactSecondaire.role"]',
    EMAIL: 'input[name="contactSecondaire.email"]',
    TELEPHONE: 'input[name="contactSecondaire.telephone"]',
  },

  // Search
  SEARCH_INPUT: 'input#structures-search[type="text"]',

  // Delete buttons
  DELETE_BUTTON: 'button[title="Supprimer"]',

  // CPOM
  CPOM_GRANULARITY_RADIO: (value: string) =>
    `input[name="granularity"][value="${value}"]`,
  CPOM_REGION_SELECT: 'select[name="region"]',
  CPOM_DEPARTEMENTS_SELECT: 'select[name="departements"]',
  CPOM_OPERATEUR_INPUT: "#operateur",
  CPOM_ACTE_START_DATE: (index: number) =>
    `input[name="actesAdministratifs.${index}.startDate"]`,
  CPOM_ACTE_END_DATE: (index: number) =>
    `input[name="actesAdministratifs.${index}.endDate"]`,
  CPOM_ACTE_DATE: (index: number) =>
    `input[name="actesAdministratifs.${index}.date"]`,
  CPOM_ADD_AVENANT_LINK: 'a:has-text("+ Ajouter un avenant")',
  /** Checkbox inputs in the INTERDEPARTEMENTALE departements panel */
  CPOM_DEPARTEMENT_CHECKBOX: (numero: string) =>
    `input[name="structure-departement"][value="${numero}"]`,
} as const;
