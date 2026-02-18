import { Page } from "@playwright/test";

import { CheckboxHelper } from "../../checkbox-helper";
import { URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { BasePage } from "../BasePage";

export class ModificationDescriptionPage extends BasePage {
  private checkboxHelper: CheckboxHelper;
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.checkboxHelper = new CheckboxHelper(page);
    this.formHelper = new FormHelper(page);
  }

  override async waitForLoad() {
    await this.waitForHeading(/Modification/i);
    await super.waitForLoad();
  }

  async updatePublic(publicValue: string) {
    await this.formHelper.selectOption(SELECTORS.PUBLIC_SELECT, {
      label: publicValue,
    });
  }

  async setVulnerabilites({
    lgbt,
    fvvTeh,
  }: {
    lgbt: boolean;
    fvvTeh: boolean;
  }) {
    await this.checkboxHelper.toggleCheckbox('input[name="lgbt"]', lgbt, {
      useLabel: true,
    });
    await this.checkboxHelper.toggleCheckbox('input[name="fvvTeh"]', fvvTeh, {
      useLabel: true,
    });
  }

  async updateContactPrincipalEmail(email: string) {
    await this.formHelper.fillInput('input[name="contacts.0.email"]', email);
  }

  async submit(structureId: number) {
    const structureUrl = URLS.structure(structureId);
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) =>
          r.url().includes("/api/structures") &&
          r.request().method() === "PUT" &&
          r.status() < 400
      ),
      this.page.getByRole("button", { name: "Valider" }).click(),
    ]);
    await response.finished();
    await this.page.waitForURL(structureUrl, { timeout: 15000 });
  }
}
