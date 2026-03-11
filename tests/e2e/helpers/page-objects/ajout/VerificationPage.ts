import { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { formatCityName } from "@/app/utils/adresse.util";
import { formatDate } from "@/app/utils/date.util";
import { formatPhoneNumber } from "@/app/utils/phone.util";

import { URLS } from "../../constants";
import { ElementNotFoundError } from "../../error-handler";
import { parseAddressParts } from "../../shared-utils";
import { TestStructureData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class VerificationPage extends BasePage {
  private waitHelper: WaitHelper;

  constructor(page: Page) {
    super(page);
    this.waitHelper = new WaitHelper(page);
  }

  async verifyData(data: TestStructureData) {
    await this.waitHelper.waitForUIUpdate(2);
    await this.waitForHeading(/Vérification des données/i, 1);

    await this.expectIdentification(data);
    await this.expectAdresses(data);
    await this.expectTypePlaces(data);
    await this.expectDocumentsFinanciers(data);
  }

  async submit(dnaCode: string, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.submitByButtonText(
        /Valider/i,
        URLS.ajoutStep(dnaCode, "06-confirmation")
      );
    }
  }

  private getSection(title: string) {
    const heading = this.page.getByRole("heading", { name: title, level: 2 });
    return heading.locator("..");
  }

  private async expectIdentification(data: TestStructureData) {
    const section = this.getSection("Identification de la structure");

    await expect(section).toContainText(data.operateur.name);
    await expect(section).toContainText(formatDate(data.creationDate));
    await expect(section).toContainText(data.public);
    if (data.lgbt) {
      await expect(section).toContainText("LGBT");
    }
    if (data.fvvTeh) {
      await expect(section).toContainText("FVV-TEH");
    }

    if (data.nom) {
      await expect(section).toContainText(data.nom);
    }
    const { addressLine, postalCode, city } = parseAddressParts(
      data.adresseAdministrative.complete
    );
    if (addressLine) {
      await expect(section).toContainText(addressLine);
    }
    if (postalCode) {
      await expect(section).toContainText(postalCode);
    }
    if (city) {
      const formattedCity = formatCityName(city);
      if (formattedCity) {
        await expect(section).toContainText(formattedCity);
      }
    }

    for (const dna of data.dnas ?? []) {
      if (!dna.code) {
        continue;
      }
      await expect(section).toContainText(dna.code);
      if ((data.dnas?.length ?? 0) > 1 && dna.description) {
        await expect(section).toContainText(dna.description);
      }
    }
    for (const finess of data.finesses ?? []) {
      if (!finess.code) {
        continue;
      }
      await expect(section).toContainText(finess.code);
      if ((data.finesses?.length ?? 0) > 1 && finess.description) {
        await expect(section).toContainText(finess.description);
      }
    }

    for (const antenne of data.antennes ?? []) {
      if (antenne.name) {
        await expect(section).toContainText(antenne.name);
      }
      const antenneAddress = antenne.adresseComplete || antenne.searchTerm;
      if (antenneAddress) {
        await expect(section).toContainText(antenneAddress);
      }
    }

    for (const contact of data.contacts ?? []) {
      const label = `${contact?.prenom} ${contact?.nom}`;
      await expect(section).toContainText(label);
      await expect(section).toContainText(contact.role ?? "");
      await expect(section).toContainText(contact.email ?? "");
      const phone = formatPhoneNumber(contact.telephone);
      if (phone) {
        await expect(section).toContainText(phone);
      }
    }

    if (data.debutPeriodeAutorisation) {
      await expect(section).toContainText(
        formatDate(data.debutPeriodeAutorisation)
      );
    }
    if (data.finPeriodeAutorisation) {
      await expect(section).toContainText(
        formatDate(data.finPeriodeAutorisation)
      );
    }
    if (data.debutConvention) {
      await expect(section).toContainText(formatDate(data.debutConvention));
    }
    if (data.finConvention) {
      await expect(section).toContainText(formatDate(data.finConvention));
    }
  }

  private async expectAdresses(data: TestStructureData) {
    const section = this.getSection("Adresses");

    await expect(section).toContainText(data.typeBati);

    if (data.adresses && data.adresses.length > 0) {
      const sectionText = (await section.textContent()) || "";
      for (const address of data.adresses) {
        const expectedAddress =
          address.adresseComplete || address.searchTerm || "";
        if (
          expectedAddress &&
          !sectionText.includes(expectedAddress) &&
          !sectionText.includes(address.searchTerm)
        ) {
          throw new ElementNotFoundError(expectedAddress, "Adresses section");
        }
        if (address.placesAutorisees) {
          await expect(section).toContainText(
            address.placesAutorisees.toString()
          );
        }
        if (address.repartition) {
          await expect(section).toContainText(address.repartition);
        }
      }
    }
  }

  private async expectTypePlaces(data: TestStructureData) {
    const section = this.getSection("Types de places");
    const rows = section
      .locator("table tr")
      .filter({ has: this.page.locator("td") });
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(data.structureTypologies.length);

    const typologiesByYear = new Map<
      number,
      TestStructureData["structureTypologies"][number]
    >();
    const remaining = [...data.structureTypologies];

    for (const typologie of data.structureTypologies) {
      const maybeYear = (typologie as { year?: number }).year;
      if (typeof maybeYear === "number") {
        typologiesByYear.set(maybeYear, typologie);
      }
    }

    const pickTypologie = (year?: number) => {
      if (year && typologiesByYear.has(year)) {
        const match = typologiesByYear.get(year);
        if (match) {
          const index = remaining.indexOf(match);
          if (index >= 0) {
            remaining.splice(index, 1);
          }
          return match;
        }
      }
      return remaining.shift();
    };

    for (let i = 0; i < rowCount; i += 1) {
      const row = rows.nth(i);
      const yearText = (await row.locator("td").first().textContent()) || "";
      const year = Number(yearText.trim());
      const typologie = pickTypologie(Number.isNaN(year) ? undefined : year);
      if (!typologie) {
        break;
      }
      const cells = row.locator("td");
      await expect(cells.nth(1)).toContainText(
        typologie.placesAutorisees.toString()
      );
      await expect(cells.nth(2)).toContainText(typologie.pmr.toString());
      await expect(cells.nth(3)).toContainText(typologie.lgbt.toString());
      await expect(cells.nth(4)).toContainText(typologie.fvvTeh.toString());
    }
  }

  private async expectDocumentsFinanciers(data: TestStructureData) {
    const section = this.getSection("Documents financiers");
    if (data.documentsFinanciers.allAddedViaAjout) {
      await expect(section).toContainText(
        "Tous les documents obligatoires ont été transmis."
      );
    }
  }
}
