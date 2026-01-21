import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { TestDataOverrides } from "./builders";

/**
 * All invalid test scenario configurations
 * These test validation by providing invalid or missing data
 */

// ========== Missing Required Fields ==========

/**
 * Invalid 1: Missing FINESS code (CADA/CPH - autorisée structures require it)
 */
export const invalidMissingFiness: TestDataOverrides = {
  type: StructureType.CADA,
  finessCode: undefined,
};

/**
 * Invalid 2: Missing creation date
 */
export const invalidMissingCreationDate: TestDataOverrides = {
  creationDate: "",
};

/**
 * Invalid 3: Missing contact principal email
 */
export const invalidMissingContactEmail: TestDataOverrides = {
  contactPrincipal: {
    prenom: "John",
    nom: "Doe",
    role: "Directeur·rice",
    email: "",
    telephone: "+33123456789",
  },
};

/**
 * Invalid 4: Missing contact principal telephone
 */
export const invalidMissingContactPhone: TestDataOverrides = {
  contactPrincipal: {
    prenom: "John",
    nom: "Doe",
    role: "Directeur·rice",
    email: "john.doe@example.com",
    telephone: "",
  },
};

/**
 * Invalid 5: Missing administrative address
 */
export const invalidMissingAdminAddress: TestDataOverrides = {
  adresseAdministrative: {
    complete: "",
    searchTerm: "",
  },
};

/**
 * Invalid 6: Missing type de bâti (will be tested at addresses step)
 */
export const invalidMissingTypeBati: TestDataOverrides = {
  // This will be tested by not selecting typeBati in the form
  typeBati: undefined as unknown as Repartition,
};

/**
 * Invalid 7: Missing structure typologies (no places data)
 */
export const invalidMissingTypologies: TestDataOverrides = {
  structureTypologies: [],
};

// ========== Invalid Data Formats/Values ==========

/**
 * Invalid 8: Invalid email format (contact principal)
 */
export const invalidEmailFormat: TestDataOverrides = {
  contactPrincipal: {
    prenom: "John",
    nom: "Doe",
    role: "Directeur·rice",
    email: "invalid-email",
    telephone: "+33123456789",
  },
};

/**
 * Invalid 9: Invalid phone format (contact principal)
 */
export const invalidPhoneFormat: TestDataOverrides = {
  contactPrincipal: {
    prenom: "John",
    nom: "Doe",
    role: "Directeur·rice",
    email: "john.doe@example.com",
    telephone: "123", // Too short
  },
};

/**
 * Invalid 10: Invalid date format (creation date)
 */
export const invalidDateFormat: TestDataOverrides = {
  creationDate: "invalid-date",
};

/**
 * Invalid 11: Invalid date relationship: creation date after date303
 * (This will be tested at documents step with date303)
 */
export const invalidDateAfter303: TestDataOverrides = {
  creationDate: "2025-01-01", // After date303
  // date303 will be set in the form to 2020-01-01
};

/**
 * Invalid 12: Invalid date relationship: debutPeriodeAutorisation after finPeriodeAutorisation
 */
export const invalidPeriodeAutorisation: TestDataOverrides = {
  debutPeriodeAutorisation: "2025-12-31",
  finPeriodeAutorisation: "2020-01-01", // Before debut
};

/**
 * Invalid 13: Invalid date relationship: debutConvention after finConvention
 */
export const invalidConventionDates: TestDataOverrides = {
  debutConvention: "2025-12-31",
  finConvention: "2020-01-01", // Before debut
};

/**
 * Invalid 14: Negative places numbers (placesAutorisees, pmr, lgbt, fvvTeh)
 */
export const invalidNegativePlaces: TestDataOverrides = {
  structureTypologies: [
    { placesAutorisees: -10, pmr: -5, lgbt: -2, fvvTeh: -1 },
  ],
};

// ========== Missing Required Documents ==========

/**
 * Invalid 15: Missing required financial documents for autorisée structure
 */
export const invalidMissingDocsAutorisee: TestDataOverrides = {
  documentsFinanciers: {
    allAddedViaAjout: true,
    files: [], // Missing required documents
  },
};

/**
 * Invalid 16: Missing required financial documents for subventionnée structure
 */
export const invalidMissingDocsSubventionnee: TestDataOverrides = {
  type: StructureType.HUDA,
  documentsFinanciers: {
    allAddedViaAjout: true,
    files: [], // Missing required documents
  },
};

/**
 * Invalid 17: Evaluation with date >= 2022 but missing notes
 * (This will be tested at finalisation step)
 */
export const invalidEvaluationMissingNotes: TestDataOverrides = {
  evaluations: [
    {
      date: "2023-09-18",
      // Missing notePersonne, notePro, noteStructure, note
      filePath: "tests/e2e/fixtures/sample.csv",
    },
  ],
};

/**
 * Invalid 18: Evaluation with date but missing file upload
 * (This will be tested at finalisation step)
 */
export const invalidEvaluationMissingFile: TestDataOverrides = {
  evaluations: [
    {
      date: "2023-09-18",
      notePersonne: "3",
      notePro: "2.5",
      noteStructure: "3.5",
      note: "3",
      // Missing filePath
    },
  ],
};

/**
 * Invalid 19: Contrôle with date but missing file upload
 * (This will be tested at finalisation step)
 */
export const invalidControleMissingFile: TestDataOverrides = {
  controles: [
    {
      date: "2022-11-05",
      type: "Programmé",
      // Missing filePath
    },
  ],
};

/**
 * Invalid 20: Places à créer > 0 but missing echeancePlacesACreer
 * (This will be tested at finalisation step)
 */
export const invalidPlacesACreerMissingEcheance: TestDataOverrides = {
  ouvertureFermeture: {
    placesACreer: "4",
    // Missing echeancePlacesACreer
    placesAFermer: undefined,
    echeancePlacesAFermer: undefined,
  },
};

/**
 * Invalid 21: Places à fermer > 0 but missing echeancePlacesAFermer
 * (This will be tested at finalisation step)
 */
export const invalidPlacesAFermerMissingEcheance: TestDataOverrides = {
  ouvertureFermeture: {
    placesACreer: undefined,
    echeancePlacesACreer: undefined,
    placesAFermer: "1",
    // Missing echeancePlacesAFermer
  },
};

// ========== Invalid Structure State ==========

/**
 * Invalid 22: Structure with no addresses
 */
export const invalidNoAddresses: TestDataOverrides = {
  adresses: [],
};

/**
 * Invalid 23: Structure with addresses but no typologies
 * (Already covered by invalidMissingTypologies)
 */
// No separate config needed - covered by invalidMissingTypologies

/**
 * Invalid 24: Structure with typologies but sum doesn't match addresses places
 */
export const invalidTypologiesMismatch: TestDataOverrides = {
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
    },
  ],
  structureTypologies: [
    { placesAutorisees: 100, pmr: 5, lgbt: 10, fvvTeh: 8 }, // Mismatch: 100 vs 50
  ],
};

// ========== Validation Edge Cases ==========

/**
 * Invalid 25: Structure with invalid DNA code format
 * (This will be tested at selection step - DNA code comes from selection)
 */
// No separate config needed - DNA code is generated by the system

/**
 * Invalid 26: Structure with invalid department code
 */
export const invalidDepartmentCode: TestDataOverrides = {
  departementAdministratif: "999", // Invalid department
};

/**
 * Invalid 27: Structure with invalid FINESS code format (wrong length/format)
 */
export const invalidFinessFormat: TestDataOverrides = {
  finessCode: "123", // Too short, should be 9 digits
};
