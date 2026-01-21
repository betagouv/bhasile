import { Page } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

import { AdressesPage } from "./page-objects/ajout/AdressesPage";
import { AuthenticationPage } from "./page-objects/ajout/AuthenticationPage";
import { ConfirmationPage } from "./page-objects/ajout/ConfirmationPage";
import { DocumentsPage } from "./page-objects/ajout/DocumentsPage";
import { IdentificationPage } from "./page-objects/ajout/IdentificationPage";
import { PresentationPage } from "./page-objects/ajout/PresentationPage";
import { SelectionPage } from "./page-objects/ajout/SelectionPage";
import { TypePlacesPage } from "./page-objects/ajout/TypePlacesPage";
import { VerificationPage } from "./page-objects/ajout/VerificationPage";
import { FinalisationControlesPage } from "./page-objects/finalisation/FinalisationControlesPage";
import { FinalisationDocumentsFinanciersPage } from "./page-objects/finalisation/FinalisationDocumentsFinanciersPage";
import { FinalisationDocumentsPage } from "./page-objects/finalisation/FinalisationDocumentsPage";
import { FinalisationFinancePage } from "./page-objects/finalisation/FinalisationFinancePage";
import { FinalisationIdentificationPage } from "./page-objects/finalisation/FinalisationIdentificationPage";
import { FinalisationNotesPage } from "./page-objects/finalisation/FinalisationNotesPage";
import { ModificationDescriptionPage } from "./page-objects/modification/ModificationDescriptionPage";
import { StructureDetailsPage } from "./page-objects/structure/StructureDetailsPage";
import { StructuresListPage } from "./page-objects/structure/StructuresListPage";
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

  const documentsPage = new DocumentsPage(page);
  await documentsPage.fillForm(formData);
  await documentsPage.submit(formData.dnaCode);

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
  await finalisationDocumentsFinanciersPage.fillMinimalData(formData);
  await finalisationDocumentsFinanciersPage.submit(structureId);

  const finalisationFinancePage = new FinalisationFinancePage(page);
  await finalisationFinancePage.waitForLoad();
  await finalisationFinancePage.fillMinimalData(formData);
  await finalisationFinancePage.submit(structureId);

  const finalisationControlesPage = new FinalisationControlesPage(page);
  await finalisationControlesPage.waitForLoad();
  await finalisationControlesPage.fillMinimalData(formData);
  await finalisationControlesPage.submit(structureId);

  const finalisationDocumentsPage = new FinalisationDocumentsPage(page);
  await finalisationDocumentsPage.waitForLoad();
  await finalisationDocumentsPage.fillMinimalData(formData);
  await finalisationDocumentsPage.submit(structureId);

  const finalisationNotesPage = new FinalisationNotesPage(page);
  await finalisationNotesPage.waitForLoad();
  await finalisationNotesPage.fillNotes(formData);
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
