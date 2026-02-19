import { Page } from "@playwright/test";

import { TIMEOUTS } from "./constants";
import { safeExecute } from "./error-handler";
import { WaitHelper } from "./wait-helper";

/**
 * Helper class for common form filling patterns
 */
export class FormHelper {
  private waitHelper: WaitHelper;

  constructor(private page: Page) {
    this.waitHelper = new WaitHelper(page);
  }

  /**
   * Fill an input field (waits for field to be ready)
   */
  async fillInput(selector: string, value: string): Promise<void> {
    await this.waitHelper.waitForFormFieldReady(selector);
    await this.page.fill(selector, value);
  }

  /**
   * Fill an input field if it exists and is enabled
   */
  async fillInputIfExists(selector: string, value: string): Promise<boolean> {
    const input = this.page.locator(selector);
    if ((await input.count()) === 0) return false;
    const enabled = await input
      .isEnabled({ timeout: TIMEOUTS.NAVIGATION })
      .catch(() => false);
    if (enabled) {
      await input.fill(value);
      return true;
    }
    return false;
  }

  /**
   * Select an option from a dropdown
   */
  async selectOption(
    selector: string,
    value: string | { label?: string; value?: string; index?: number }
  ): Promise<void> {
    await this.waitHelper.waitForFormFieldReady(selector);
    await this.page.selectOption(selector, value);
  }

  /**
   * Toggle a switch/checkbox (for boolean fields)
   */
  async toggleSwitch(
    selector: string,
    shouldBeChecked: boolean
  ): Promise<void> {
    const toggle = this.page.locator(selector);
    await toggle.waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });
    const isChecked = await safeExecute(
      () => toggle.isChecked(),
      false,
      `Failed to check toggle state for ${selector}`
    );
    if (isChecked !== shouldBeChecked) {
      await toggle.click();
      // Wait for any UI updates after toggle
      await this.waitHelper.waitForUIUpdate();
    }
  }

  /**
   * Fill a date input field
   */
  async fillDate(selector: string, date: string): Promise<void> {
    await this.fillInput(selector, date);
  }

  /**
   * Fill contact information
   */
  async fillContact(
    prefix: string,
    contact: {
      prenom?: string;
      nom?: string;
      role?: string;
      email?: string;
      telephone?: string;
    }
  ): Promise<void> {
    await this.fillInput(
      `input[name="${prefix}.prenom"]`,
      contact.prenom ?? ""
    );
    await this.fillInput(`input[name="${prefix}.nom"]`, contact.nom ?? "");
    await this.fillInput(`input[name="${prefix}.role"]`, contact.role ?? "");
    await this.fillInput(`input[name="${prefix}.email"]`, contact.email ?? "");
    await this.fillInput(
      `input[name="${prefix}.telephone"]`,
      contact.telephone ?? ""
    );
  }

  /**
   * Fill multiple inputs in sequence
   */
  async fillInputs(
    fields: Array<{ selector: string; value: string }>
  ): Promise<void> {
    for (const field of fields) {
      await this.fillInputIfExists(field.selector, field.value);
    }
  }

  /**
   * Clear an input field
   */
  async clearInput(selector: string): Promise<void> {
    await this.waitHelper.waitForFormFieldReady(selector);
    await this.page.fill(selector, "");
  }
}
