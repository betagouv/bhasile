import { expect, Page } from "@playwright/test";

import { TIMEOUTS } from "./constants";
import { safeExecute } from "./error-handler";

/**
 * Helper class for consistent checkbox interactions in e2e tests
 */
export class CheckboxHelper {
  constructor(private page: Page) {}

  /**
   * Toggle a checkbox to a specific state (checked or unchecked)
   * Handles both direct checkbox clicks and label clicks
   */
  async toggleCheckbox(
    selector: string,
    shouldBeChecked: boolean,
    options?: { useLabel?: boolean; force?: boolean }
  ): Promise<void> {
    const checkbox = this.page.locator(selector);
    await expect(checkbox).toBeVisible({ timeout: TIMEOUTS.NAVIGATION });
    const isChecked = await safeExecute(
      () => checkbox.isChecked(),
      false,
      `Failed to check checkbox state for ${selector}`
    );

    if (isChecked !== shouldBeChecked) {
      if (options?.useLabel) {
        // Click the label associated with the checkbox
        await this.page.click(`${selector} + label`, { force: options.force });
      } else {
        // Direct checkbox click
        await checkbox.click({ force: options?.force });
      }
    }
  }

  /**
   * Check a checkbox (ensures it's checked)
   */
  async check(
    selector: string,
    options?: { useLabel?: boolean; force?: boolean }
  ): Promise<void> {
    await this.toggleCheckbox(selector, true, options);
  }

  /**
   * Uncheck a checkbox (ensures it's unchecked)
   */
  async uncheck(
    selector: string,
    options?: { useLabel?: boolean; force?: boolean }
  ): Promise<void> {
    await this.toggleCheckbox(selector, false, options);
  }

  /**
   * Click a checkbox by value attribute (useful for filter checkboxes)
   */
  async clickByValue(value: string): Promise<void> {
    const checkbox = this.page.locator(
      `input[type="checkbox"][value="${value}"]`
    );
    await checkbox.waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });

    await checkbox.click({ force: true });
  }

  /**
   * Verify a checkbox is in the expected state
   */
  async expectChecked(selector: string, expectedState: boolean): Promise<void> {
    const checkbox = this.page.locator(selector);
    await expect(checkbox).toBeVisible();
    if (expectedState) {
      await expect(checkbox).toBeChecked();
    } else {
      await expect(checkbox).not.toBeChecked();
    }
  }

  /**
   * Get checkbox state
   */
  async isChecked(selector: string): Promise<boolean> {
    const checkbox = this.page.locator(selector);
    return safeExecute(
      () => checkbox.isChecked(),
      false,
      `Failed to get checkbox state for ${selector}`
    );
  }
}
