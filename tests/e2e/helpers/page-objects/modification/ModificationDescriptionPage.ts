import { Page } from "@playwright/test";

import { CheckboxHelper } from "../../checkbox-helper";
import { URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { ModificationData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class ModificationDescriptionPage extends BasePage {
  private checkboxHelper: CheckboxHelper;
  private formHelper: FormHelper;
  private waitHelper: WaitHelper;

  constructor(page: Page) {
    super(page);
    this.checkboxHelper = new CheckboxHelper(page);
    this.formHelper = new FormHelper(page);
    this.waitHelper = new WaitHelper(page);
  }

  override async waitForLoad() {
    await this.waitForHeading(/Modification/i);
    await super.waitForLoad();
  }

  async fillForm(data: ModificationData) {
    await this.updatePublic(data.public);

    await this.setVulnerabilites({
      lgbt: data.lgbt,
      fvvTeh: data.fvvTeh,
    });

    await this.updateContactPrincipalEmail(data.contactPrincipal?.email);

    await this.waitHelper.waitForUIUpdate();
  }

  async updatePublic(publicValue?: string) {
    if (publicValue) {
      await this.formHelper.selectOption(SELECTORS.PUBLIC_SELECT, {
        label: publicValue,
      });
    }

    await this.waitHelper.waitForUIUpdate();
  }

  async setVulnerabilites({
    lgbt,
    fvvTeh,
  }: {
    lgbt?: boolean;
    fvvTeh?: boolean;
  }) {
    if (lgbt !== undefined) {
      await this.checkboxHelper.toggleCheckbox('input[name="lgbt"]', lgbt, {
        useLabel: true,
      });
    }
    if (fvvTeh !== undefined) {
      await this.checkboxHelper.toggleCheckbox('input[name="fvvTeh"]', fvvTeh, {
        useLabel: true,
      });
    }
  }

  async updateContactPrincipalEmail(email?: string) {
    if (email) {
      await this.formHelper.fillInput('input[name="contacts.0.email"]', email);
    }
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(URLS.structure(structureId));
  }
}
