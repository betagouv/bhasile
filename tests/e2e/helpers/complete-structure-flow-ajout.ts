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
import { FailingStep, TestStructureData } from "./test-data/types";

// Helper type: Partial data but with required codeBhasile and structure id (for step URLs)
type TestStructureDataWithCodeBhasile = Partial<TestStructureData> & {
  codeBhasile: string;
  id: number;
};

export type CompleteAjoutFlowResult =
  | { completed: true }
  | { stoppedAtFailingStep: true };
/**
 * Runs the ajout (creation) flow: authentication, selection, identification,
 * adresses, type places, documents financiers, verification, confirmation.
 * Returns stoppedAtFailingStep = true when validation fails at expected step.
 */
export async function completeAjoutFlow(
  page: Page,
  formData: TestStructureDataWithCodeBhasile,
  failingStep?: FailingStep
): Promise<CompleteAjoutFlowResult> {
  const authPage = new AuthenticationPage(page);
  await authPage.authenticate();

  const presentationPage = new PresentationPage(page);
  await presentationPage.navigateToSelectionStep();

  const selectionPage = new SelectionPage(page);
  await selectionPage.selectStructure(formData as TestStructureData);

  const structureId = String(formData.id);

  const identificationPage = new IdentificationPage(page);
  await identificationPage.fillForm(formData as TestStructureData);
  const shouldFailAtIdentification = failingStep === "identification";
  await identificationPage.submit(
    structureId,
    shouldFailAtIdentification
  );
  if (shouldFailAtIdentification) {
    return { stoppedAtFailingStep: true };
  }

  const adressesPage = new AdressesPage(page);
  await adressesPage.fillForm(formData as TestStructureData);
  const shouldFailAtAdresses = failingStep === "adresses";
  await adressesPage.submit(structureId, shouldFailAtAdresses);
  if (shouldFailAtAdresses) {
    return { stoppedAtFailingStep: true };
  }

  const typePlacesPage = new TypePlacesPage(page);
  await typePlacesPage.fillForm(formData as TestStructureData);
  const shouldFailAtTypePlaces = failingStep === "type-places";
  await typePlacesPage.submit(structureId, shouldFailAtTypePlaces);
  if (shouldFailAtTypePlaces) {
    return { stoppedAtFailingStep: true };
  }

  const documentsFinanciersPage = new DocumentsFinanciersPage(page);
  await documentsFinanciersPage.waitForLoad();
  await documentsFinanciersPage.fillForm(formData as TestStructureData);
  const shouldFailAtDocuments = failingStep === "documents";
  await documentsFinanciersPage.submit(structureId, shouldFailAtDocuments);
  if (shouldFailAtDocuments) {
    return { stoppedAtFailingStep: true };
  }

  const verificationPage = new VerificationPage(page);
  await verificationPage.verifyData(formData as TestStructureData);
  const shouldFailAtVerification = failingStep === "verification";
  await verificationPage.submit(structureId, shouldFailAtVerification);
  if (shouldFailAtVerification) {
    return { stoppedAtFailingStep: true };
  }

  const confirmationPage = new ConfirmationPage(page);
  await confirmationPage.verifySuccess();

  return { completed: true };
}
