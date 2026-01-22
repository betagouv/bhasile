import { expect, Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "./constants";
import {
  AdressesPage,
  AuthenticationPage,
  DocumentsFinanciersPage,
  IdentificationPage,
  PresentationPage,
  SelectionPage,
  TypePlacesPage,
} from "./page-objects";
import { TestStructureData } from "./test-data/types";

export type InvalidSubmissionStep =
  | "01-identification"
  | "02-adresses"
  | "03-type-places"
  | "04-documents";

/**
 * Navigates to a specific step in the ajout flow
 */
async function navigateToStep(
  page: Page,
  formData: TestStructureData,
  step: InvalidSubmissionStep
): Promise<void> {
  const authPage = new AuthenticationPage(page);
  await authPage.authenticate();

  const presentationPage = new PresentationPage(page);
  await presentationPage.navigateToSelectionStep();

  const selectionPage = new SelectionPage(page);
  await selectionPage.selectStructure(formData);

  // Navigate to the target step if not already there
  const currentUrl = page.url();
  const targetUrl = URLS.ajoutStep(formData.dnaCode, step);

  if (!currentUrl.includes(step)) {
    await page.goto(targetUrl);
    await page.waitForLoadState("domcontentloaded");
  }
}

/**
 * Attempts to submit a form with invalid data and expects validation to prevent navigation
 *
 * IMPORTANT: When testing step N, formData must have VALID data for steps 1..N-1.
 * Only the target step (N) should have invalid data.
 *
 * @param page - Playwright page instance
 * @param formData - Test data (must be valid for previous steps, invalid for target step)
 * @param step - The step to test validation on
 * @param expectedErrorMessages - Optional list of error messages to verify
 */
export async function attemptInvalidSubmission(
  page: Page,
  formData: TestStructureData,
  step: InvalidSubmissionStep,
  expectedErrorMessages?: string[]
): Promise<void> {
  // Navigate to the step
  await navigateToStep(page, formData, step);

  // Fill form with data (which may contain invalid values for the target step)
  // Note: Previous steps must have valid data to allow navigation to target step
  switch (step) {
    case "01-identification": {
      const identificationPage = new IdentificationPage(page);
      await identificationPage.fillForm(formData);
      break;
    }
    case "02-adresses": {
      // Need to pass identification first (must be valid)
      const identificationPage = new IdentificationPage(page);
      await identificationPage.fillForm(formData);
      try {
        await identificationPage.submit(formData.dnaCode);
      } catch (error) {
        throw new Error(
          `Cannot test invalid adresses submission: identification step failed to submit. ` +
            `Ensure formData has valid identification data. Original error: ${error}`
        );
      }

      const adressesPage = new AdressesPage(page);
      await adressesPage.fillForm(formData);
      break;
    }
    case "03-type-places": {
      // Need to pass previous steps (must be valid)
      const identificationPage = new IdentificationPage(page);
      await identificationPage.fillForm(formData);
      try {
        await identificationPage.submit(formData.dnaCode);
      } catch (error) {
        throw new Error(
          `Cannot test invalid type-places submission: identification step failed. ` +
            `Ensure formData has valid identification data. Original error: ${error}`
        );
      }

      const adressesPage = new AdressesPage(page);
      await adressesPage.fillForm(formData);
      try {
        await adressesPage.submit(formData.dnaCode);
      } catch (error) {
        throw new Error(
          `Cannot test invalid type-places submission: adresses step failed. ` +
            `Ensure formData has valid adresses data. Original error: ${error}`
        );
      }

      const typePlacesPage = new TypePlacesPage(page);
      await typePlacesPage.fillForm(formData);
      break;
    }
    case "04-documents": {
      // Need to pass previous steps (must be valid)
      const identificationPage = new IdentificationPage(page);
      await identificationPage.fillForm(formData);
      try {
        await identificationPage.submit(formData.dnaCode);
      } catch (error) {
        throw new Error(
          `Cannot test invalid documents submission: identification step failed. ` +
            `Ensure formData has valid identification data. Original error: ${error}`
        );
      }

      const adressesPage = new AdressesPage(page);
      await adressesPage.fillForm(formData);
      try {
        await adressesPage.submit(formData.dnaCode);
      } catch (error) {
        throw new Error(
          `Cannot test invalid documents submission: adresses step failed. ` +
            `Ensure formData has valid adresses data. Original error: ${error}`
        );
      }

      const typePlacesPage = new TypePlacesPage(page);
      await typePlacesPage.fillForm(formData);
      try {
        await typePlacesPage.submit(formData.dnaCode);
      } catch (error) {
        throw new Error(
          `Cannot test invalid documents submission: type-places step failed. ` +
            `Ensure formData has valid type-places data. Original error: ${error}`
        );
      }

      const documentsFinanciersPage = new DocumentsFinanciersPage(page);
      await documentsFinanciersPage.fillForm(formData);
      break;
    }
  }

  // Get the current URL before attempting submission
  const initialUrl = page.url();
  const expectedUrlPattern = new RegExp(step);

  // Attempt to submit
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  // Wait a moment to ensure navigation doesn't happen
  await page.waitForTimeout(TIMEOUTS.UI_UPDATE * 2);

  // Assert we're still on the same page (validation prevented navigation)
  const currentUrl = page.url();
  expect(currentUrl).toMatch(expectedUrlPattern);
  expect(currentUrl).toBe(initialUrl);

  // Assert error messages are visible if provided
  if (expectedErrorMessages && expectedErrorMessages.length > 0) {
    for (const errorMessage of expectedErrorMessages) {
      // Try to find the error message - it might be in various places
      const errorLocator = page.getByText(errorMessage, { exact: false });
      const errorCount = await errorLocator.count();

      if (errorCount === 0) {
        // Also check for error messages in input state-related messages
        const errorInputs = page.locator(
          'input[aria-invalid="true"], select[aria-invalid="true"]'
        );
        const inputCount = await errorInputs.count();

        if (inputCount === 0) {
          // Check for error styling
          const errorElements = page.locator(".border-red-500, .text-red-500");
          const elementCount = await errorElements.count();

          if (elementCount === 0) {
            throw new Error(
              `Expected error message "${errorMessage}" not found on page. Current URL: ${currentUrl}`
            );
          }
        }
      } else {
        await expect(errorLocator.first()).toBeVisible({
          timeout: TIMEOUTS.NAVIGATION,
        });
      }
    }
  } else {
    // If no specific error messages provided, at least verify there are error states
    const errorInputs = page.locator(
      'input[aria-invalid="true"], select[aria-invalid="true"]'
    );
    const errorCount = await errorInputs.count();

    if (errorCount === 0) {
      // Check for error styling as fallback
      const errorElements = page.locator(".border-red-500, .text-red-500");
      const elementCount = await errorElements.count();

      if (elementCount === 0) {
        throw new Error(
          `Expected validation errors but none found. Form may have incorrectly submitted. Current URL: ${currentUrl}`
        );
      }
    }
  }
}

/**
 * Helper to attempt invalid submission at identification step
 */
export async function attemptInvalidIdentificationSubmission(
  page: Page,
  formData: TestStructureData,
  expectedErrorMessages?: string[]
): Promise<void> {
  await attemptInvalidSubmission(
    page,
    formData,
    "01-identification",
    expectedErrorMessages
  );
}

/**
 * Helper to attempt invalid submission at addresses step
 */
export async function attemptInvalidAdressesSubmission(
  page: Page,
  formData: TestStructureData,
  expectedErrorMessages?: string[]
): Promise<void> {
  await attemptInvalidSubmission(
    page,
    formData,
    "02-adresses",
    expectedErrorMessages
  );
}

/**
 * Helper to attempt invalid submission at type places step
 */
export async function attemptInvalidTypePlacesSubmission(
  page: Page,
  formData: TestStructureData,
  expectedErrorMessages?: string[]
): Promise<void> {
  await attemptInvalidSubmission(
    page,
    formData,
    "03-type-places",
    expectedErrorMessages
  );
}

/**
 * Helper to attempt invalid submission at documents step
 */
export async function attemptInvalidDocumentsSubmission(
  page: Page,
  formData: TestStructureData,
  expectedErrorMessages?: string[]
): Promise<void> {
  await attemptInvalidSubmission(
    page,
    formData,
    "04-documents",
    expectedErrorMessages
  );
}
