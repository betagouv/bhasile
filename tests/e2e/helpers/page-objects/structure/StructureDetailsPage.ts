import { expect, Locator } from "@playwright/test";

import { formatDate, getYearFromDate } from "@/app/utils/date.util";
import { getCategoryLabel } from "@/app/utils/file-upload.util";
import { formatPhoneNumber } from "@/app/utils/phone.util";
import { getOperateurLabel } from "@/app/utils/structure.util";
import { ActeAdministratifCategoryType } from "@/types/file-upload.type";
import { PublicType } from "@/types/structure.type";

import { URLS } from "../../constants";
import {
  escapeForRegex,
  getActesCategoryLabel,
  normalizeDocumentCategory,
  parseAddressParts,
} from "../../shared-utils";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class StructureDetailsPage extends BasePage {
  async navigateTo(structureId: number) {
    await this.page.goto(URLS.structure(structureId));
  }

  override async waitForLoad() {
    await expect(
      this.page.getByRole("heading", { name: "Description" })
    ).toBeVisible();
  }

  async openDescriptionEdit() {
    const block = this.getBlockByTitle("Description");
    await block.getByRole("button", { name: "Modifier" }).click();
  }

  async showContacts() {
    const block = this.getBlockByTitle("Description");
    const hiddenToggle = block.getByRole("button", {
      name: "Masquer les contacts",
    });
    if (!(await hiddenToggle.isVisible())) {
      await block.getByRole("button", { name: "Voir les contacts" }).click();
    }
  }

  async expectPublic(publicValue: string) {
    const block = this.getBlockByTitle("Description");
    await expect(
      block.getByText("Public", { exact: true }).locator("..")
    ).toContainText(publicValue);
  }

  async expectVulnerabilite(vulnerabiliteValue: string) {
    const block = this.getBlockByTitle("Description");
    await expect(
      block.getByText("Vulnérabilité", { exact: true }).locator("..")
    ).toContainText(vulnerabiliteValue);
  }

  async expectContactEmail(email: string) {
    const block = this.getBlockByTitle("Description");
    await expect(block.getByText(email, { exact: true })).toBeVisible();
  }

  async expectAllData(
    data: TestStructureData,
    overrides: StructureDetailsOverrides
  ) {
    const descriptionBlock = this.getBlockByTitle("Description");
    await this.expectDescriptionData(descriptionBlock, data, overrides);
    await this.expectContactsData(descriptionBlock, data, overrides);
    await this.expectTypePlaces(data);
    await this.expectDocumentsFinanciers(data);
    await this.expectActesAdministratifs(
      overrides.actesAdministratifs ?? data.actesAdministratifs ?? []
    );
    await this.expectNotes(overrides.notes);
  }

  private getBlockByTitle(title: string): Locator {
    const heading = this.page.getByRole("heading", { name: title, level: 3 });
    return heading.locator("..").locator("..").locator("..");
  }

  private async expectDescriptionData(
    block: Locator,
    data: TestStructureData,
    overrides: StructureDetailsOverrides
  ) {
    const publicValue = overrides.publicValue ?? data.public;
    const publicLabel =
      PublicType[publicValue as keyof typeof PublicType] ?? publicValue;
    const lgbt = overrides.lgbt ?? data.lgbt;
    const fvvTeh = overrides.fvvTeh ?? data.fvvTeh;
    const vulnerabilites: string[] = [];
    if (lgbt) {
      vulnerabilites.push("LGBT");
    }
    if (fvvTeh) {
      vulnerabilites.push("FVV", "TEH");
    }
    const vulnerabiliteLabel = vulnerabilites.join(", ") || "N/A";

    await expect(
      block.getByText("Date de création", { exact: true }).locator("..")
    ).toContainText(formatDate(data.creationDate));
    await expect(
      block.getByText("Type de structure", { exact: true }).locator("..")
    ).toContainText(data.type);
    await expect(
      block.getByText("Code DNA (OFII)", { exact: true }).locator("..")
    ).toContainText(data.dnaCode);
    if (data.finessCode) {
      await expect(
        block.getByText("Code FINESS", { exact: true }).locator("..")
      ).toContainText(data.finessCode.replaceAll(" ", ""));
    }
    const operateurLabel = getOperateurLabel(data.filiale, data.operateur.name);
    if (operateurLabel) {
      await expect(
        block.getByText("Opérateur", { exact: true }).locator("..")
      ).toContainText(operateurLabel);
    }
    await expect(
      block.getByText("Public", { exact: true }).locator("..")
    ).toContainText(publicLabel);
    await expect(
      block.getByText("Vulnérabilité", { exact: true }).locator("..")
    ).toContainText(vulnerabiliteLabel);

    const { addressLine, postalCode, city } = parseAddressParts(
      data.adresseAdministrative.complete
    );
    const addressRow = block.getByText("Adresse administrative", {
      exact: true,
    });
    if (data.nom) {
      await expect(addressRow.locator("..")).toContainText(data.nom);
    }
    if (addressLine) {
      await expect(addressRow.locator("..")).toContainText(addressLine);
    }
    if (postalCode) {
      await expect(addressRow.locator("..")).toContainText(postalCode);
    }
    if (city) {
      await expect(addressRow.locator("..")).toContainText(city);
    }
  }

  private async expectContactsData(
    block: Locator,
    data: TestStructureData,
    overrides: StructureDetailsOverrides
  ) {
    await this.showContacts();
    const contactPrincipal = data.contactPrincipal;
    const contactSecondaire = data.contactSecondaire;
    const principalEmail = overrides.contactEmail || contactPrincipal.email;

    await this.expectContactLine(block, {
      prenom: contactPrincipal.prenom,
      nom: contactPrincipal.nom,
      role: contactPrincipal.role,
      email: principalEmail,
      telephone: contactPrincipal.telephone,
    });
    if (contactSecondaire) {
      await this.expectContactLine(block, contactSecondaire);
    }
  }

  private async expectContactLine(
    block: Locator,
    contact: {
      prenom: string;
      nom: string;
      role: string;
      email: string;
      telephone: string;
    }
  ) {
    const contactLabel = `${contact.prenom} ${contact.nom} (${contact.role})`;
    const formattedPhone = formatPhoneNumber(contact.telephone);
    await expect(block.getByText(contactLabel, { exact: true })).toBeVisible();
    await expect(block.getByText(contact.email, { exact: true })).toBeVisible();
    if (formattedPhone) {
      await expect(
        block.getByText(new RegExp(escapeForRegex(formattedPhone)))
      ).toBeVisible();
    }
  }

  private async expectTypePlaces(data: TestStructureData) {
    const typePlacesBlock = this.getBlockByTitle("Type de places");
    const historyButton = typePlacesBlock.getByRole("button", {
      name: "Historique",
    });
    await historyButton.click();

    const historyTable = typePlacesBlock.getByRole("table").first();
    for (const typologie of data.structureTypologies) {
      await expect(historyTable).toContainText(
        typologie.placesAutorisees.toString()
      );
      await expect(historyTable).toContainText(typologie.pmr.toString());
      await expect(historyTable).toContainText(typologie.lgbt.toString());
      await expect(historyTable).toContainText(typologie.fvvTeh.toString());
    }
  }

  private async expectDocumentsFinanciers(data: TestStructureData) {
    const financesBlock = this.getBlockByTitle("Finances");
    const documentsByYear = data.documentsFinanciers.fileUploads.reduce(
      (acc, file) => {
        const year = Number(file.year);
        acc[year] = acc[year] || [];
        acc[year].push(file.category);
        return acc;
      },
      {} as Record<number, string[]>
    );

    for (const [year, categories] of Object.entries(documentsByYear)) {
      const yearButton = financesBlock.getByRole("button", {
        name: year,
      });
      await yearButton.click();
      const financesText = (await financesBlock.textContent()) || "";
      if (financesText.includes("Aucun document importé")) {
        continue;
      }
      for (const category of categories) {
        await expect(financesBlock).toContainText(
          normalizeDocumentCategory(category)
        );
      }
    }
  }

  private async expectActesAdministratifs(
    actes: StructureDetailsOverrides["actesAdministratifs"]
  ) {
    if (!actes || actes.length === 0) {
      return;
    }
    const actesBlock = this.getBlockByTitle("Actes administratifs");
    const actesText = (await actesBlock.textContent()) || "";
    if (actesText.includes("Aucun document importé")) {
      return;
    }
    for (const acte of actes) {
      const accordionLabel = getActesCategoryLabel(acte.category);
      const accordionButton = actesBlock.getByRole("button", {
        name: accordionLabel,
      });
      if ((await accordionButton.count()) === 0) {
        continue;
      }
      await accordionButton.click();
      if (acte.category === "AUTRE" && acte.categoryName) {
        await expect(actesBlock).toContainText(acte.categoryName);
        continue;
      }
      if (acte.startDate && acte.endDate) {
        const startYear = getYearFromDate(acte.startDate);
        const endYear = getYearFromDate(acte.endDate);
        const label = `${getCategoryLabel(acte.category)} ${startYear} - ${endYear}`;
        await expect(actesBlock).toContainText(label);
      }
    }
  }

  private async expectNotes(notes: string | undefined) {
    if (!notes) {
      return;
    }
    const notesBlock = this.getBlockByTitle("Notes");
    await expect(notesBlock).toContainText(notes);
  }
}

type StructureDetailsOverrides = {
  publicValue?: string;
  lgbt?: boolean;
  fvvTeh?: boolean;
  contactEmail?: string;
  notes?: string;
  actesAdministratifs?: Array<{
    category: ActeAdministratifCategoryType[number];
    categoryName?: string;
    startDate?: string;
    endDate?: string;
  }>;
};
