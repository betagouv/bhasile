import { test } from "@playwright/test";

import { beforeFlow } from "./helpers/before-flow";
import {
  attemptInvalidAdressesSubmission,
  attemptInvalidDocumentsSubmission,
  attemptInvalidIdentificationSubmission,
} from "./helpers/invalid-submission-flow";
import { deleteStructureViaApi } from "./helpers/structure-creator";
import {
  invalidConventionDates,
  invalidDateFormat,
  invalidDepartmentCode,
  invalidEmailFormat,
  invalidFinessFormat,
  invalidMissingAdminAddress,
  invalidMissingContactEmail,
  invalidMissingContactPhone,
  invalidMissingCreationDate,
  invalidMissingDocsAutorisee,
  invalidMissingDocsSubventionnee,
  invalidMissingFiness,
  invalidMissingTypologies,
  invalidNegativePlaces,
  invalidNoAddresses,
  invalidPeriodeAutorisation,
  invalidPhoneFormat,
  invalidTypologiesMismatch,
} from "./helpers/test-data/invalid-scenarios";

const invalidTestCases = [
  {
    name: "Missing FINESS code for CADA",
    config: invalidMissingFiness,
    step: "01-identification",
    helper: attemptInvalidIdentificationSubmission,
    expectedErrors: [
      "Le code FINESS est obligatoire pour les structures autorisées",
    ],
  },
  {
    name: "Missing creation date",
    config: invalidMissingCreationDate,
    step: "01-identification",
    helper: attemptInvalidIdentificationSubmission,
    expectedErrors: ["La date de création est requise"],
  },
  {
    name: "Missing contact principal email",
    config: invalidMissingContactEmail,
    step: "01-identification",
    helper: attemptInvalidIdentificationSubmission,
    expectedErrors: ["Ce champ est requis"],
  },
  {
    name: "Missing contact principal telephone",
    config: invalidMissingContactPhone,
    step: "01-identification",
    helper: attemptInvalidIdentificationSubmission,
    expectedErrors: ["Ce champ est requis"],
  },
  {
    name: "Missing administrative address",
    config: invalidMissingAdminAddress,
    step: "02-adresses",
    helper: attemptInvalidAdressesSubmission,
    expectedErrors: ["L'adresse administrative est requise"],
  },
  {
    name: "Missing structure typologies",
    config: invalidMissingTypologies,
    step: "03-type-places",
    helper: attemptInvalidDocumentsSubmission, // Will need to navigate through previous steps
    expectedErrors: [],
  },
  {
    name: "Invalid email format",
    config: invalidEmailFormat,
    step: "01-identification",
    helper: attemptInvalidIdentificationSubmission,
    expectedErrors: [],
  },
  {
    name: "Invalid phone format",
    config: invalidPhoneFormat,
    step: "01-identification",
    helper: attemptInvalidIdentificationSubmission,
    expectedErrors: [],
  },
  {
    name: "Invalid date format",
    config: invalidDateFormat,
    step: "01-identification",
    helper: attemptInvalidIdentificationSubmission,
    expectedErrors: [],
  },
  {
    name: "Invalid periode autorisation dates",
    config: invalidPeriodeAutorisation,
    step: "01-identification",
    helper: attemptInvalidIdentificationSubmission,
    expectedErrors: [],
  },
  {
    name: "Invalid convention dates",
    config: invalidConventionDates,
    step: "01-identification",
    helper: attemptInvalidIdentificationSubmission,
    expectedErrors: [],
  },
  {
    name: "Negative places numbers",
    config: invalidNegativePlaces,
    step: "03-type-places",
    helper: attemptInvalidDocumentsSubmission,
    expectedErrors: [],
  },
  {
    name: "Missing required financial documents (autorisée)",
    config: invalidMissingDocsAutorisee,
    step: "04-documents",
    helper: attemptInvalidDocumentsSubmission,
    expectedErrors: ["Ce champ est requis"],
  },
  {
    name: "Missing required financial documents (subventionnée)",
    config: invalidMissingDocsSubventionnee,
    step: "04-documents",
    helper: attemptInvalidDocumentsSubmission,
    expectedErrors: ["Ce champ est requis"],
  },
  {
    name: "No addresses",
    config: invalidNoAddresses,
    step: "02-adresses",
    helper: attemptInvalidAdressesSubmission,
    expectedErrors: [],
  },
  {
    name: "Typologies mismatch with addresses",
    config: invalidTypologiesMismatch,
    step: "03-type-places",
    helper: attemptInvalidDocumentsSubmission,
    expectedErrors: [],
  },
  {
    name: "Invalid department code",
    config: invalidDepartmentCode,
    step: "02-adresses",
    helper: attemptInvalidAdressesSubmission,
    expectedErrors: [],
  },
  {
    name: "Invalid FINESS code format",
    config: invalidFinessFormat,
    step: "01-identification",
    helper: attemptInvalidIdentificationSubmission,
    expectedErrors: [],
  },
];

for (const { name, config, helper, expectedErrors } of invalidTestCases) {
  test(`Invalid: ${name}`, async ({ page }) => {
    const formData = await beforeFlow(config, page);

    try {
      await helper(page, formData, expectedErrors);
    } finally {
      // Try to clean up if structure was created
      try {
        await deleteStructureViaApi(formData.dnaCode);
      } catch {
        // Ignore cleanup errors for invalid scenarios
      }
    }
  });
}
