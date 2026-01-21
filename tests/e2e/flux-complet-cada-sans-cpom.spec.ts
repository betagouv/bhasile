import { test } from "@playwright/test";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";

import { AdressesPage } from "./helpers/page-objects/ajout/AdressesPage";
import { AuthenticationPage } from "./helpers/page-objects/ajout/AuthenticationPage";
import { ConfirmationPage } from "./helpers/page-objects/ajout/ConfirmationPage";
import { DocumentsPage } from "./helpers/page-objects/ajout/DocumentsPage";
import { IdentificationPage } from "./helpers/page-objects/ajout/IdentificationPage";
import { PresentationPage } from "./helpers/page-objects/ajout/PresentationPage";
import { SelectionPage } from "./helpers/page-objects/ajout/SelectionPage";
import { TypePlacesPage } from "./helpers/page-objects/ajout/TypePlacesPage";
import { VerificationPage } from "./helpers/page-objects/ajout/VerificationPage";
import { FinalisationControlesPage } from "./helpers/page-objects/finalisation/FinalisationControlesPage";
import { FinalisationDocumentsPage } from "./helpers/page-objects/finalisation/FinalisationDocumentsPage";
import { FinalisationDocumentsFinanciersPage } from "./helpers/page-objects/finalisation/FinalisationDocumentsFinanciersPage";
import { FinalisationFinancePage } from "./helpers/page-objects/finalisation/FinalisationFinancePage";
import { FinalisationIdentificationPage } from "./helpers/page-objects/finalisation/FinalisationIdentificationPage";
import { FinalisationNotesPage } from "./helpers/page-objects/finalisation/FinalisationNotesPage";
import { ModificationDescriptionPage } from "./helpers/page-objects/modification/ModificationDescriptionPage";
import { StructureDetailsPage } from "./helpers/page-objects/structure/StructureDetailsPage";
import {
  deleteStructureViaApi,
  getStructureId,
  seedStructureForSelection,
} from "./helpers/structure-creator";
import { cadaSansCpom } from "./helpers/test-data";

// Increase timeout for the full create -> finalise -> modify flow
test.setTimeout(180000);

test("CADA sans CPOM - Flux complet (création, finalisation, modification)", async ({
  page,
}) => {
  const operateurSuffix = uuidv4().slice(0, 8);
  const operateurName = `Operateur E2E ${operateurSuffix}`;
  const formData = {
    ...cadaSansCpom,
    dnaCode: `C${uuidv4()}`,
    identification: {
      ...cadaSansCpom.identification,
      operateur: {
        name: operateurName,
        searchTerm: operateurName,
      },
    },
  };

  const mockFileKey = `e2e-doc-${uuidv4()}`;
  await page.route("**/api/files**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const fileKey = url.pathname.split("/").pop() || mockFileKey;

    if (method === "POST" && url.pathname.endsWith("/api/files")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          key: mockFileKey,
          mimeType: "text/csv",
          originalName: "sample.csv",
          id: 1,
          fileSize: 20,
        }),
      });
      return;
    }

    if (method === "GET" && url.searchParams.get("getLink") === "true") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ url: "http://example.com/sample.csv" }),
      });
      return;
    }

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          key: fileKey,
          mimeType: "text/csv",
          originalName: "sample.csv",
          id: 1,
          fileSize: 20,
        }),
      });
      return;
    }

    if (method === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({}),
      });
      return;
    }

    await route.fallback();
  });

  const addressSuggestion = buildAddressSuggestion(
    formData.adresses.adresseAdministrative.complete
  );
  await page.route("https://api-adresse.data.gouv.fr/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ features: [addressSuggestion] }),
    });
  });

  // Seed the structure so the selection list can find it (no existing forms).
  await seedStructureForSelection(formData);

  try {
    // Step 1: Create structure via form (password-protected)
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
    await documentsPage.fillForm({
      filePath: path.join(process.cwd(), "tests/e2e/fixtures/sample.csv"),
      categoryLabel: "Budget prévisionnel demandé",
      year: 2025,
    });
    await documentsPage.fillForm([
      {
        filePath: path.join(process.cwd(), "tests/e2e/fixtures/sample.csv"),
        categoryLabel: "Budget prévisionnel retenu (ou exécutoire)",
        year: 2025,
      },
      {
        filePath: path.join(process.cwd(), "tests/e2e/fixtures/sample.csv"),
        categoryLabel: "Compte administratif soumis",
        year: 2024,
      },
      {
        filePath: path.join(process.cwd(), "tests/e2e/fixtures/sample.csv"),
        categoryLabel: "Rapport d'activité",
        year: 2024,
      },
      {
        filePath: path.join(process.cwd(), "tests/e2e/fixtures/sample.csv"),
        categoryLabel: "Compte administratif retenu",
        year: 2023,
      },
    ]);
    await documentsPage.submit(formData.dnaCode);

    const verificationPage = new VerificationPage(page);
    await verificationPage.verifyData(formData);
    await verificationPage.submit(formData.dnaCode);

    const confirmationPage = new ConfirmationPage(page);
    await confirmationPage.verifySuccess();

    // Step 2: Finalisation flow (agent side)
    const structureId = await getStructureId(formData.dnaCode);
    await page.goto(
      `http://localhost:3000/structures/${structureId}/finalisation/01-identification`
    );

    const finalisationIdentificationPage = new FinalisationIdentificationPage(
      page
    );
    await finalisationIdentificationPage.waitForLoad();
    await finalisationIdentificationPage.submit(structureId);

    const finalisationDocumentsFinanciersPage =
      new FinalisationDocumentsFinanciersPage(page);
    await finalisationDocumentsFinanciersPage.waitForLoad();
    await finalisationDocumentsFinanciersPage.fillMinimalData();
    await finalisationDocumentsFinanciersPage.submit(structureId);

    const finalisationFinancePage = new FinalisationFinancePage(page);
    await finalisationFinancePage.waitForLoad();
    await finalisationFinancePage.fillMinimalData();
    await finalisationFinancePage.submit(structureId, formData.dnaCode);

    const finalisationControlesPage = new FinalisationControlesPage(page);
    await finalisationControlesPage.waitForLoad();
    await finalisationControlesPage.fillMinimalData();
    await finalisationControlesPage.submit(structureId, formData.dnaCode);

    const finalisationDocumentsPage = new FinalisationDocumentsPage(page);
    await finalisationDocumentsPage.waitForLoad();
    await finalisationDocumentsPage.fillMinimalData({
      filePath: path.join(process.cwd(), "tests/e2e/fixtures/sample.csv"),
      startDate: "2024-01-01",
      endDate: "2025-12-31",
      categoryName: "Document e2e",
    });
    await finalisationDocumentsPage.submit(structureId, formData.dnaCode);

    const finalisationNotesPage = new FinalisationNotesPage(page);
    await finalisationNotesPage.waitForLoad();
    await finalisationNotesPage.fillNotes();
    await finalisationNotesPage.submit(structureId);
    await finalisationNotesPage.verifySuccess();

    // Step 3: Modify structure description
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

    // Step 4: Verify structure page displays updated values
    await structurePage.waitForLoad();
    await structurePage.expectPublic(updatedPublic);
    await structurePage.expectVulnerabilite("LGBT");
    await structurePage.showContacts();
    await structurePage.expectContactEmail(updatedEmail);
  } finally {
    await deleteStructureViaApi(formData.dnaCode);
  }
});

const buildAddressSuggestion = (fullAddress: string) => {
  const parts = fullAddress.trim().split(/\s+/);
  const postalCodeMatch = parts.find((part) => /^\d{5}$/.test(part));
  const postalCode = postalCodeMatch || "75001";
  const postalIndex = parts.findIndex((part) => part === postalCode);
  const city =
    postalIndex > -1 ? parts.slice(postalIndex + 1).join(" ") : "Paris";
  const street =
    postalIndex > -1 ? parts.slice(0, postalIndex).join(" ") : fullAddress;
  const [housenumber, ...streetParts] = street.split(/\s+/);
  const department = postalCode.startsWith("20")
    ? postalCode.substring(0, 3)
    : postalCode.substring(0, 2);

  return {
    properties: {
      label: fullAddress,
      score: 0.9,
      housenumber: /^\d+$/.test(housenumber) ? housenumber : undefined,
      street: streetParts.length > 0 ? streetParts.join(" ") : street,
      postcode: postalCode,
      city,
      context: `${department}, ${city}`,
    },
    geometry: {
      coordinates: [2.3522, 48.8566],
    },
  };
};
