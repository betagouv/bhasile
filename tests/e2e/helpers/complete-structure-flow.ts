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
import { TestStructureData } from "./test-data";

export const completeStructureFlow = async (
  page: Page,
  formData: TestStructureData
) => {
  // Step 1: Ajout
  const authPage = new AuthenticationPage(page);
  await authPage.authenticate();

  const presentationPage = new PresentationPage(page);
  await presentationPage.navigateToSelectionStep();

  const selectionPage = new SelectionPage(page);
  await selectionPage.selectStructure(formData);

  const identificationPage = new IdentificationPage(page);
  await identificationPage.fillForm(formData);
  await identificationPage.submit(formData.dnaCode);

  const adressesPage = new AdressesPage(page);
  await adressesPage.fillForm(formData);
  await adressesPage.submit(formData.dnaCode);

  const typePlacesPage = new TypePlacesPage(page);
  await typePlacesPage.fillForm(formData);
  await typePlacesPage.submit(formData.dnaCode);

  const documentsFinanciersPage = new DocumentsFinanciersPage(page);
  await documentsFinanciersPage.fillForm(formData);
  await documentsFinanciersPage.submit(formData.dnaCode);

  const verificationPage = new VerificationPage(page);
  await verificationPage.verifyData(formData);
  await verificationPage.submit(formData.dnaCode);

  const confirmationPage = new ConfirmationPage(page);
  await confirmationPage.verifySuccess();

  // Step 2: Finalisation
  const structureId = await getStructureId(formData.dnaCode);
  const structuresListPage = new StructuresListPage(page);
  await structuresListPage.navigate();
  await structuresListPage.searchByDna(formData.dnaCode);
  await structuresListPage.startFinalisationForDna(formData.dnaCode);

  const finalisationIdentificationPage = new FinalisationIdentificationPage(
    page
  );
  await finalisationIdentificationPage.waitForLoad();
  await finalisationIdentificationPage.submit(structureId);

  const finalisationDocumentsFinanciersPage =
    new FinalisationDocumentsFinanciersPage(page);
  await finalisationDocumentsFinanciersPage.waitForLoad();
  await finalisationDocumentsFinanciersPage.fillForm(formData);
  await finalisationDocumentsFinanciersPage.submit(structureId);

  const finalisationFinancePage = new FinalisationFinancePage(page);
  await finalisationFinancePage.waitForLoad();
  await finalisationFinancePage.fillForm(formData);
  await finalisationFinancePage.submit(structureId);

  const finalisationControlesPage = new FinalisationControlesPage(page);
  await finalisationControlesPage.waitForLoad();
  await finalisationControlesPage.fillForm(formData);
  await finalisationControlesPage.submit(structureId);

  const finalisationDocumentsPage = new FinalisationDocumentsPage(page);
  await finalisationDocumentsPage.waitForLoad();
  await finalisationDocumentsPage.fillForm(formData);
  await finalisationDocumentsPage.submit(structureId);

  const finalisationNotesPage = new FinalisationNotesPage(page);
  await finalisationNotesPage.waitForLoad();
  await finalisationNotesPage.fillForm(formData);
  await finalisationNotesPage.submit(structureId);
  await finalisationNotesPage.finalizeAndGoToStructure(structureId);

  // Step 3: Modification
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

  // Step 4: Page structure
  await structurePage.waitForLoad();
  await structurePage.expectAllData(formData, {
    publicValue: updatedPublic,
    lgbt: true,
    fvvTeh: false,
    contactEmail: updatedEmail,
    notes: formData.finalisationNotes,
  });
};
