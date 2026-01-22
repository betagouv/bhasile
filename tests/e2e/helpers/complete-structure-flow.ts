import { Page } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

import {
  AdressesPage,
  AuthenticationPage,
  ConfirmationPage,
  DocumentsFinanciersPage,
  FinalisationControlesPage,
  FinalisationDocumentsFinanciersPage,
  FinalisationDocumentsPage,
  FinalisationFinancePage,
  FinalisationIdentificationPage,
  FinalisationNotesPage,
  IdentificationPage,
  ModificationDescriptionPage,
  PresentationPage,
  SelectionPage,
  StructureDetailsPage,
  StructuresListPage,
  TypePlacesPage,
  VerificationPage,
} from "./page-objects";
import { getStructureId } from "./structure-creator";
import { FailingStep, TestStructureData } from "./test-data/types";

// Helper type: Partial data but with required dnaCode
type TestStructureDataWithDnaCode = Partial<TestStructureData> & {
  dnaCode: string;
};

export const completeStructureFlow = async (
  page: Page,
  formData: Partial<TestStructureData>,
  options?: { failingStep?: FailingStep }
) => {
  if (!formData.dnaCode) {
    throw new Error("dnaCode is required");
  }
  const dataWithDna = formData as TestStructureDataWithDnaCode;

  const authPage = new AuthenticationPage(page);
  await authPage.authenticate();

  const presentationPage = new PresentationPage(page);
  await presentationPage.navigateToSelectionStep();

  const selectionPage = new SelectionPage(page);
  await selectionPage.selectStructure(dataWithDna as TestStructureData);

  const identificationPage = new IdentificationPage(page);
  await identificationPage.fillForm(dataWithDna as TestStructureData);
  const shouldFailAtIdentification = options?.failingStep === "identification";
  await identificationPage.submit(
    dataWithDna.dnaCode,
    shouldFailAtIdentification
  );
  if (shouldFailAtIdentification) {
    return; // Test should pass - validation failure occurred as expected
  }

  const adressesPage = new AdressesPage(page);
  await adressesPage.fillForm(dataWithDna as TestStructureData);
  const shouldFailAtAdresses = options?.failingStep === "adresses";
  await adressesPage.submit(dataWithDna.dnaCode, shouldFailAtAdresses);
  if (shouldFailAtAdresses) {
    return; // Test should pass - validation failure occurred as expected
  }

  const typePlacesPage = new TypePlacesPage(page);
  await typePlacesPage.fillForm(dataWithDna as TestStructureData);
  const shouldFailAtTypePlaces = options?.failingStep === "type-places";
  await typePlacesPage.submit(dataWithDna.dnaCode, shouldFailAtTypePlaces);
  if (shouldFailAtTypePlaces) {
    return; // Test should pass - validation failure occurred as expected
  }

  const documentsFinanciersPage = new DocumentsFinanciersPage(page);
  await documentsFinanciersPage.fillForm(dataWithDna as TestStructureData);
  const shouldFailAtDocuments = options?.failingStep === "documents";
  await documentsFinanciersPage.submit(
    dataWithDna.dnaCode,
    shouldFailAtDocuments
  );
  if (shouldFailAtDocuments) {
    return; // Test should pass - validation failure occurred as expected
  }

  const verificationPage = new VerificationPage(page);
  await verificationPage.verifyData(dataWithDna as TestStructureData);
  const shouldFailAtVerification = options?.failingStep === "verification";
  await verificationPage.submit(dataWithDna.dnaCode, shouldFailAtVerification);
  if (shouldFailAtVerification) {
    return; // Test should pass - validation failure occurred as expected
  }

  const confirmationPage = new ConfirmationPage(page);
  await confirmationPage.verifySuccess();

  const structureId = await getStructureId(dataWithDna.dnaCode);
  const structuresListPage = new StructuresListPage(page);
  await structuresListPage.navigate();
  await structuresListPage.searchByDna(dataWithDna.dnaCode);
  await structuresListPage.startFinalisationForDna(dataWithDna.dnaCode);

  const finalisationIdentificationPage = new FinalisationIdentificationPage(
    page
  );
  await finalisationIdentificationPage.waitForLoad();
  const shouldFailAtFinalisationIdentification =
    options?.failingStep === "finalisationIdentification";
  await finalisationIdentificationPage.submit(
    structureId,
    shouldFailAtFinalisationIdentification
  );
  if (shouldFailAtFinalisationIdentification) {
    return;
  }

  const finalisationDocumentsFinanciersPage =
    new FinalisationDocumentsFinanciersPage(page);
  await finalisationDocumentsFinanciersPage.waitForLoad();
  await finalisationDocumentsFinanciersPage.fillForm(
    dataWithDna as TestStructureData
  );
  const shouldFailAtFinalisationDocumentsFinanciers =
    options?.failingStep === "finalisationDocumentsFinanciers";
  await finalisationDocumentsFinanciersPage.submit(
    structureId,
    shouldFailAtFinalisationDocumentsFinanciers
  );
  if (shouldFailAtFinalisationDocumentsFinanciers) {
    return;
  }

  const finalisationFinancePage = new FinalisationFinancePage(page);
  await finalisationFinancePage.waitForLoad();
  await finalisationFinancePage.fillForm(dataWithDna as TestStructureData);
  const shouldFailAtFinalisationFinance =
    options?.failingStep === "finalisationFinance";
  await finalisationFinancePage.submit(
    structureId,
    shouldFailAtFinalisationFinance
  );
  if (shouldFailAtFinalisationFinance) {
    return;
  }

  const finalisationControlesPage = new FinalisationControlesPage(page);
  await finalisationControlesPage.waitForLoad();
  await finalisationControlesPage.fillForm(dataWithDna as TestStructureData);
  const shouldFailAtFinalisationControles =
    options?.failingStep === "finalisationControles";
  await finalisationControlesPage.submit(
    structureId,
    shouldFailAtFinalisationControles
  );
  if (shouldFailAtFinalisationControles) {
    return;
  }

  const finalisationDocumentsPage = new FinalisationDocumentsPage(page);
  await finalisationDocumentsPage.waitForLoad();
  await finalisationDocumentsPage.fillForm(dataWithDna as TestStructureData);
  const shouldFailAtFinalisationDocuments =
    options?.failingStep === "finalisationDocuments";
  await finalisationDocumentsPage.submit(
    structureId,
    shouldFailAtFinalisationDocuments
  );
  if (shouldFailAtFinalisationDocuments) {
    return;
  }

  const finalisationNotesPage = new FinalisationNotesPage(page);
  await finalisationNotesPage.waitForLoad();
  await finalisationNotesPage.fillForm(dataWithDna as TestStructureData);
  const shouldFailAtFinalisationNotes =
    options?.failingStep === "finalisationNotes";
  await finalisationNotesPage.submit(
    structureId,
    shouldFailAtFinalisationNotes
  );
  if (shouldFailAtFinalisationNotes) {
    return;
  }
  await finalisationNotesPage.finalizeAndGoToStructure(structureId);

  const structurePage = new StructureDetailsPage(page);
  await structurePage.navigateTo(structureId);
  await structurePage.waitForLoad();
  await structurePage.openDescriptionEdit();

  const modificationDescriptionPage = new ModificationDescriptionPage(page);
  await modificationDescriptionPage.waitForLoad();

  const updatedEmail = `contact-${uuidv4()}@example.com`;
  const updatedPublic = "Famille";

  await modificationDescriptionPage.updatePublic(updatedPublic);
  await modificationDescriptionPage.setVulnerabilites({
    lgbt: true,
    fvvTeh: false,
  });
  await modificationDescriptionPage.updateContactPrincipalEmail(updatedEmail);
  await modificationDescriptionPage.submit(structureId);

  await structurePage.waitForLoad();
  await structurePage.expectAllData(dataWithDna as TestStructureData, {
    publicValue: updatedPublic,
    lgbt: true,
    fvvTeh: false,
    contactEmail: updatedEmail,
  });
};
