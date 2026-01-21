/**
 * Example test file for invalid data scenarios
 * 
 * This file demonstrates how to use the invalid submission helpers.
 * Copy and modify this pattern for your actual invalid test scenarios.
 */

import { test } from "@playwright/test";

import { beforeFlow } from "./helpers/before-flow";
import {
  attemptInvalidIdentificationSubmission,
  attemptInvalidAdressesSubmission,
  attemptInvalidDocumentsSubmission,
} from "./helpers/invalid-submission-flow";

// Example: Missing FINESS code for CADA (autorisée structure)
test("Invalid: Missing FINESS code for CADA", async ({ page }) => {
  const formData = await beforeFlow(
    {
      // All other data is valid, but finessCode is missing
      finessCode: undefined,
    },
    page
  );

  await attemptInvalidIdentificationSubmission(page, formData, [
    "Le code FINESS est obligatoire pour les structures autorisées",
  ]);
});

// Example: Missing required field at addresses step
test("Invalid: Missing administrative address", async ({ page }) => {
  const formData = await beforeFlow(
    {
      // Identification data is valid (allows us to reach addresses step)
      // But address data is invalid
      adresseAdministrative: {
        complete: "",
        searchTerm: "",
      },
    },
    page
  );

  await attemptInvalidAdressesSubmission(page, formData, [
    "L'adresse administrative est requise",
  ]);
});

// Example: Missing required documents
test("Invalid: Missing required financial documents", async ({ page }) => {
  const formData = await beforeFlow(
    {
      // Previous steps have valid data
      // But documents are missing
      documentsFinanciers: {
        allAddedViaAjout: false,
        files: [], // No documents!
      },
    },
    page
  );

  await attemptInvalidDocumentsSubmission(page, formData, [
    "Ce champ est requis", // Generic required field error
  ]);
});
