import { Repartition } from "@/types/adresse.type";

import { TestDataOverrides } from "./builders";

/**
 * All valid test scenario configurations
 * These represent different combinations of structure types, address types, contacts, documents, etc.
 */

// ========== CADA Scenarios ==========

/**
 * CADA 1: Collectif, single address (same as admin), one contact, all docs at ajout,
 * old evaluation (<2022), with controls, with facultative docs
 */
export const validCada1: TestDataOverrides = {
  typeBati: Repartition.COLLECTIF,
  sameAddress: true,
  contactSecondaire: undefined,
  // When sameAddress is true, adresses should be empty - form auto-creates from admin address
  adresses: [],
  documentsFinanciers: {
    allAddedViaAjout: true,
    files: [
      { year: "2025", category: "Budget prévisionnel demandé", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2025", category: "Budget prévisionnel retenu (ou exécutoire)", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2024", category: "Budget prévisionnel demandé", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2024", category: "Budget prévisionnel retenu (ou exécutoire)", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2024", category: "Compte administratif soumis", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2024", category: "Rapport d'activité", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2023", category: "Budget prévisionnel demandé", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2023", category: "Budget prévisionnel retenu (ou exécutoire)", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2023", category: "Compte administratif soumis", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2023", category: "Rapport d'activité", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2023", category: "Compte administratif retenu", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2022", category: "Budget prévisionnel demandé", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2022", category: "Budget prévisionnel retenu (ou exécutoire)", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2022", category: "Compte administratif soumis", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2022", category: "Rapport d'activité", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2022", category: "Compte administratif retenu", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2021", category: "Budget prévisionnel demandé", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2021", category: "Budget prévisionnel retenu (ou exécutoire)", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2021", category: "Compte administratif soumis", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2021", category: "Rapport d'activité", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
      { year: "2021", category: "Compte administratif retenu", fileName: "sample.csv", filePath: "tests/e2e/fixtures/sample.csv", formKind: "ajout" },
    ],
  },
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  controles: [
    { date: "2022-11-05", type: "Programmé", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  actesAdministratifs: [
    { category: "ARRETE_AUTORISATION", startDate: "2020-01-01", endDate: "2025-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "CONVENTION", startDate: "2021-01-01", endDate: "2024-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "ARRETE_TARIFICATION", startDate: "2022-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "AUTRE", categoryName: "Document e2e", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
};

/**
 * CADA 2: Diffus, multiple addresses, two contacts, minimal docs at ajout (some at finalisation),
 * recent evaluation (>=2022) with notes, no controls, no facultative docs
 */
export const validCada2: TestDataOverrides = {
  typeBati: Repartition.DIFFUS,
  sameAddress: false,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 150,
    },
  ],
  documentsFinanciers: {
    allAddedViaAjout: false,
    // Base data has all required documents - we'll override formKind for some to test mixed scenario
    // Don't override files - use base data's full set, just change allAddedViaAjout flag
  },
  evaluations: [
    {
      date: "2023-09-18",
      notePersonne: "3",
      notePro: "2.5",
      noteStructure: "3.5",
      note: "3",
      filePath: "tests/e2e/fixtures/sample.csv",
    },
  ],
  controles: [],
  // Required actes for autorisée structures
  actesAdministratifs: [
    { category: "ARRETE_AUTORISATION", startDate: "2020-01-01", endDate: "2025-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "ARRETE_TARIFICATION", startDate: "2022-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
};

/**
 * CADA 3: Mixte, multiple addresses, one contact, mixed docs (some ajout/some finalisation),
 * old + recent evaluations, with controls, with actes administratifs
 */
export const validCada3: TestDataOverrides = {
  typeBati: Repartition.MIXTE,
  sameAddress: false,
  contactSecondaire: undefined,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
      repartition: Repartition.DIFFUS,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 150,
      repartition: Repartition.COLLECTIF,
    },
  ],
  documentsFinanciers: {
    allAddedViaAjout: false,
    // Use base data's full document set - all documents will be at ajout, which is fine for testing
    // At finalisation, they'll be imported (expected behavior)
  },
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
    {
      date: "2023-09-18",
      notePersonne: "3",
      notePro: "2.5",
      noteStructure: "3.5",
      note: "3",
      filePath: "tests/e2e/fixtures/sample.csv",
    },
  ],
  controles: [
    { date: "2022-11-05", type: "Programmé", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  actesAdministratifs: [
    { category: "ARRETE_AUTORISATION", startDate: "2020-01-01", endDate: "2025-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "ARRETE_TARIFICATION", startDate: "2022-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "CONVENTION", startDate: "2021-01-01", endDate: "2024-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
};

/**
 * CADA 4: Collectif, single address, two contacts, all docs at ajout,
 * TODO: remove evaluation (young structure), no controls, minimal finances
 */
export const validCada4: TestDataOverrides = {
  typeBati: Repartition.COLLECTIF,
  sameAddress: false,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
  ],
  // Ensure structureTypologies match the single address - need 3 entries (one per year: 2023-2025)
  structureTypologies: [
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
  ],
  // Use base documents - all required documents for autorisée structure
  // Don't override documentsFinanciers to use base data with all required docs
  // TODO: remove evaluation (young structure)
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  controles: [],
  // Required actes for autorisée structures
  actesAdministratifs: [
    { category: "ARRETE_AUTORISATION", startDate: "2020-01-01", endDate: "2025-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "ARRETE_TARIFICATION", startDate: "2022-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  // Use base data's full finances - "minimal" just means we don't override
};

/**
 * CADA 5: Diffus, multiple addresses (3+), one contact, minimal docs at ajout (some at finalisation),
 * recent evaluation with plan d'action, multiple controls, full finances
 */
export const validCada5: TestDataOverrides = {
  typeBati: Repartition.DIFFUS,
  sameAddress: false,
  contactSecondaire: undefined,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 150,
    },
    {
      adresseComplete: "3 Rue de la Paix 75001 Paris",
      searchTerm: "3 Rue de la Paix 75001 Paris",
      placesAutorisees: 100,
    },
  ],
  structureTypologies: [
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
    { placesAutorisees: 150, pmr: 15, lgbt: 20, fvvTeh: 18 },
    { placesAutorisees: 100, pmr: 10, lgbt: 15, fvvTeh: 12 },
  ],
  documentsFinanciers: {
    allAddedViaAjout: false,
    // Use base data's full document set
  },
  evaluations: [
    {
      date: "2023-09-18",
      notePersonne: "3",
      notePro: "2.5",
      noteStructure: "3.5",
      note: "3",
      filePath: "tests/e2e/fixtures/sample.csv",
      planActionFilePath: "tests/e2e/fixtures/sample.csv",
    },
  ],
  controles: [
    { date: "2022-11-05", type: "Programmé", filePath: "tests/e2e/fixtures/sample.csv" },
    { date: "2024-03-14", type: "Inopiné", filePath: "tests/e2e/fixtures/sample.csv" },
    { date: "2024-06-20", type: "Programmé", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
};

// ========== CPH Scenarios ==========

/**
 * CPH 1: Collectif, single address, one contact, all docs at ajout,
 * old evaluation, with controls, with filiale
 */
export const validCph1: TestDataOverrides = {
  typeBati: Repartition.COLLECTIF,
  sameAddress: false,
  contactSecondaire: undefined,
  filiale: "Filiale Test",
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
  ],
  // Ensure structureTypologies match the single address - need 3 entries (one per year: 2023-2025)
  structureTypologies: [
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
  ],
  // Use base documents - all required documents for autorisée structure
  // Don't override documentsFinanciers to use base data with all required docs
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  controles: [
    { date: "2022-11-05", type: "Programmé", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  // Required actes for autorisée structures
  actesAdministratifs: [
    { category: "ARRETE_AUTORISATION", startDate: "2020-01-01", endDate: "2025-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "ARRETE_TARIFICATION", startDate: "2022-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
};

/**
 * CPH 2: Mixte, multiple addresses, two contacts, mixed docs,
 * recent evaluation, no controls
 */
export const validCph2: TestDataOverrides = {
  typeBati: Repartition.MIXTE,
  sameAddress: false,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
      repartition: Repartition.DIFFUS,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 150,
      repartition: Repartition.COLLECTIF,
    },
  ],
  documentsFinanciers: {
    allAddedViaAjout: false,
    // Use base data's full document set
  },
  evaluations: [
    {
      date: "2023-09-18",
      notePersonne: "3",
      notePro: "2.5",
      noteStructure: "3.5",
      note: "3",
      filePath: "tests/e2e/fixtures/sample.csv",
    },
  ],
  controles: [],
  // Required actes for autorisée structures
  actesAdministratifs: [
    { category: "ARRETE_AUTORISATION", startDate: "2020-01-01", endDate: "2025-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "ARRETE_TARIFICATION", startDate: "2022-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
};

/**
 * CPH 3: Diffus, multiple addresses, one contact, minimal docs at ajout (some at finalisation),
 * TODO: remove evaluation, minimal data
 */
export const validCph3: TestDataOverrides = {
  typeBati: Repartition.DIFFUS,
  sameAddress: false,
  contactSecondaire: undefined,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 150,
    },
  ],
  documentsFinanciers: {
    allAddedViaAjout: false,
    // Use base data's full document set
  },
  // TODO: remove evaluation
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  controles: [],
  // Required actes for autorisée structures
  actesAdministratifs: [
    { category: "ARRETE_AUTORISATION", startDate: "2020-01-01", endDate: "2025-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "ARRETE_TARIFICATION", startDate: "2022-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  // Use base data's full finances - "minimal" just means we don't override
};

// ========== HUDA Scenarios ==========

/**
 * HUDA 1: Collectif, single address, one contact, all docs at ajout,
 * TODO: remove evaluation (not required for subventionnée), no controls, with convention dates, minimal finances
 */
export const validHuda1: TestDataOverrides = {
  typeBati: Repartition.COLLECTIF,
  sameAddress: false,
  contactSecondaire: undefined,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
  ],
  // Ensure structureTypologies match the single address - need 3 entries (one per year: 2023-2025)
  structureTypologies: [
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
  ],
  // Use base documents - all required documents for subventionnée structure
  // Don't override documentsFinanciers to use base data with all required docs
  // TODO: remove evaluation (not required for subventionnée)
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  controles: [],
  // Required actes for subventionnée structures (CONVENTION is required)
  actesAdministratifs: [
    { category: "CONVENTION", startDate: "2020-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  // Use base data's full finances - "minimal" just means we don't override
};

/**
 * HUDA 2: Diffus, multiple addresses, two contacts, mixed docs,
 * with controls (optional), full finances, with actes administratifs
 */
export const validHuda2: TestDataOverrides = {
  typeBati: Repartition.DIFFUS,
  sameAddress: false,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 150,
    },
  ],
  documentsFinanciers: {
    allAddedViaAjout: false,
    // Use base data's full document set
  },
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  controles: [
    { date: "2022-11-05", type: "Programmé", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  actesAdministratifs: [
    { category: "CONVENTION", startDate: "2020-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "AUTRE", categoryName: "Document e2e", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
};

/**
 * HUDA 3: Mixte, multiple addresses, one contact, minimal docs at ajout (some at finalisation),
 * with convention dates
 */
export const validHuda3: TestDataOverrides = {
  typeBati: Repartition.MIXTE,
  sameAddress: false,
  contactSecondaire: undefined,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
      repartition: Repartition.DIFFUS,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 150,
      repartition: Repartition.COLLECTIF,
    },
  ],
  documentsFinanciers: {
    allAddedViaAjout: false,
    // Use base data's full document set
  },
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  controles: [],
  // Required actes for subventionnée structures (CONVENTION is required)
  actesAdministratifs: [
    { category: "CONVENTION", startDate: "2020-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
};

// ========== CAES Scenarios ==========

/**
 * CAES 1: Collectif, single address, two contacts, all docs at ajout,
 * with convention dates, minimal finances, with filiale
 */
export const validCaes1: TestDataOverrides = {
  typeBati: Repartition.COLLECTIF,
  sameAddress: false,
  filiale: "Filiale Test",
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
  ],
  // Ensure structureTypologies match the single address - need 3 entries (one per year: 2023-2025)
  structureTypologies: [
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
  ],
  // Use base documents - all required documents for subventionnée structure
  // Don't override documentsFinanciers to use base data with all required docs
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  controles: [],
  // Required actes for subventionnée structures (CONVENTION is required)
  actesAdministratifs: [
    { category: "CONVENTION", startDate: "2020-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  // Use base data's full finances - "minimal" just means we don't override
};

/**
 * CAES 2: Diffus, multiple addresses, one contact, mixed docs,
 * with controls, full finances
 */
export const validCaes2: TestDataOverrides = {
  typeBati: Repartition.DIFFUS,
  sameAddress: false,
  contactSecondaire: undefined,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 150,
    },
  ],
  documentsFinanciers: {
    allAddedViaAjout: false,
    // Use base data's full document set
  },
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  controles: [
    { date: "2022-11-05", type: "Programmé", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
};

/**
 * CAES 3: Mixte, multiple addresses, one contact, minimal docs at ajout (some at finalisation),
 * minimal data
 */
export const validCaes3: TestDataOverrides = {
  typeBati: Repartition.MIXTE,
  sameAddress: false,
  contactSecondaire: undefined,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
      repartition: Repartition.DIFFUS,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 150,
      repartition: Repartition.COLLECTIF,
    },
  ],
  documentsFinanciers: {
    allAddedViaAjout: false,
    // Use base data's full document set
  },
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  controles: [],
  // Required actes for subventionnée structures (CONVENTION is required)
  actesAdministratifs: [
    { category: "CONVENTION", startDate: "2020-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  // Use base data's full finances - "minimal" just means we don't override
};

// ========== Edge Case ==========

/**
 * CADA Edge Case: Large structure (200+ places), multiple addresses (5+), two contacts,
 * all docs at ajout, multiple evaluations (3+), multiple controls (3+), full finances, all actes types
 */
export const validCadaEdgeCase: TestDataOverrides = {
  typeBati: Repartition.DIFFUS,
  sameAddress: false,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 60,
    },
    {
      adresseComplete: "3 Rue de la Paix 75001 Paris",
      searchTerm: "3 Rue de la Paix 75001 Paris",
      placesAutorisees: 40,
    },
    {
      adresseComplete: "4 Rue de la Paix 75001 Paris",
      searchTerm: "4 Rue de la Paix 75001 Paris",
      placesAutorisees: 30,
    },
    {
      adresseComplete: "5 Rue de la Paix 75001 Paris",
      searchTerm: "5 Rue de la Paix 75001 Paris",
      placesAutorisees: 20,
    },
  ],
  structureTypologies: [
    { placesAutorisees: 50, pmr: 5, lgbt: 10, fvvTeh: 8 },
    { placesAutorisees: 60, pmr: 6, lgbt: 12, fvvTeh: 10 },
    { placesAutorisees: 40, pmr: 4, lgbt: 8, fvvTeh: 6 },
    { placesAutorisees: 30, pmr: 3, lgbt: 6, fvvTeh: 5 },
    { placesAutorisees: 20, pmr: 2, lgbt: 4, fvvTeh: 3 },
  ],
  // Use base documents - all required documents for autorisée structure
  // Don't override documentsFinanciers to use base data with all required docs
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
    {
      date: "2022-08-15",
      notePersonne: "2.5",
      notePro: "3",
      noteStructure: "2.8",
      note: "2.8",
      filePath: "tests/e2e/fixtures/sample.csv",
    },
    {
      date: "2023-09-18",
      notePersonne: "3",
      notePro: "2.5",
      noteStructure: "3.5",
      note: "3",
      filePath: "tests/e2e/fixtures/sample.csv",
      planActionFilePath: "tests/e2e/fixtures/sample.csv",
    },
  ],
  controles: [
    { date: "2022-11-05", type: "Programmé", filePath: "tests/e2e/fixtures/sample.csv" },
    { date: "2024-03-14", type: "Inopiné", filePath: "tests/e2e/fixtures/sample.csv" },
    { date: "2024-06-20", type: "Programmé", filePath: "tests/e2e/fixtures/sample.csv" },
    { date: "2024-09-10", type: "Inopiné", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  actesAdministratifs: [
    { category: "ARRETE_AUTORISATION", startDate: "2020-01-01", endDate: "2025-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "CONVENTION", startDate: "2021-01-01", endDate: "2024-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "ARRETE_TARIFICATION", startDate: "2022-01-01", endDate: "2023-12-31", filePath: "tests/e2e/fixtures/sample.csv" },
    { category: "AUTRE", categoryName: "Document e2e", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
};
