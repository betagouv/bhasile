import { Page } from "@playwright/test";

import { AdressesPage } from "./page-objects/ajout/AdressesPage";
import { AuthenticationPage } from "./page-objects/ajout/AuthenticationPage";
import { ConfirmationPage } from "./page-objects/ajout/ConfirmationPage";
import { DocumentsFinanciersPage } from "./page-objects/ajout/DocumentsFinanciersPage";
import { IdentificationPage } from "./page-objects/ajout/IdentificationPage";
import { PresentationPage } from "./page-objects/ajout/PresentationPage";
import { SelectionPage } from "./page-objects/ajout/SelectionPage";
import { TypePlacesPage } from "./page-objects/ajout/TypePlacesPage";
import { VerificationPage } from "./page-objects/ajout/VerificationPage";
import { getStructureId } from "./structure-creator";
import { FailingStep, TestStructureData } from "./test-data/types";

// Helper type: Partial data but with required dnaCode
type TestStructureDataWithDnaCode = Partial<TestStructureData> & {
  dnaCode: string;
};

export type CompleteAjoutFlowResult =
  | { structureId: number }
  | { stoppedAtFailingStep: true };

/**
 * Runs the ajout (creation) flow: authentication, selection, identification,
 * adresses, type places, documents financiers, verification, confirmation.
 * Returns structureId on success, or stoppedAtFailingStep when validation fails at expected step.
 */
export async function completeAjoutFlow(
  page: Page,
  formData: TestStructureDataWithDnaCode,
  failingStep?: FailingStep
): Promise<CompleteAjoutFlowResult> {
  const authPage = new AuthenticationPage(page);
  await authPage.authenticate();

  const presentationPage = new PresentationPage(page);
  await presentationPage.navigateToSelectionStep();

  const selectionPage = new SelectionPage(page);
  await selectionPage.selectStructure(formData as TestStructureData);

  const identificationPage = new IdentificationPage(page);
  await identificationPage.fillForm(formData as TestStructureData);
  const shouldFailAtIdentification = failingStep === "identification";
  await identificationPage.submit(
    formData.dnaCode,
    shouldFailAtIdentification
  );
  if (shouldFailAtIdentification) {
    return { stoppedAtFailingStep: true };
  }

  const adressesPage = new AdressesPage(page);
  await adressesPage.fillForm(formData as TestStructureData);
  const shouldFailAtAdresses = failingStep === "adresses";
  await adressesPage.submit(formData.dnaCode, shouldFailAtAdresses);
  if (shouldFailAtAdresses) {
    return { stoppedAtFailingStep: true };
  }

  const typePlacesPage = new TypePlacesPage(page);
  await typePlacesPage.fillForm(formData as TestStructureData);
  const shouldFailAtTypePlaces = failingStep === "type-places";
  await typePlacesPage.submit(formData.dnaCode, shouldFailAtTypePlaces);
  if (shouldFailAtTypePlaces) {
    return { stoppedAtFailingStep: true };
  }

  const documentsFinanciersPage = new DocumentsFinanciersPage(page);
  await documentsFinanciersPage.waitForLoad();
  await documentsFinanciersPage.fillForm(formData as TestStructureData);
  const shouldFailAtDocuments = failingStep === "documents";
  await documentsFinanciersPage.submit(
    formData.dnaCode,
    shouldFailAtDocuments
  );
  if (shouldFailAtDocuments) {
    return { stoppedAtFailingStep: true };
  }

  const verificationPage = new VerificationPage(page);
  await verificationPage.verifyData(formData as TestStructureData);
  const shouldFailAtVerification = failingStep === "verification";
  await verificationPage.submit(formData.dnaCode, shouldFailAtVerification);
  if (shouldFailAtVerification) {
    return { stoppedAtFailingStep: true };
  }

  const confirmationPage = new ConfirmationPage(page);
  await confirmationPage.verifySuccess();

  const structureId = await getStructureId(formData.dnaCode);
  return { structureId };
}
