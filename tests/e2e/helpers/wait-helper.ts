import { Page } from "@playwright/test";

import { TIMEOUTS } from "../constants";

/**
 * Helper class for common wait patterns in e2e tests
 * Provides methods to replace waitForTimeout with proper waits
 */
export class WaitHelper {
  constructor(private page: Page) {}

  /**
   * Wait for UI to update after an interaction
   * Prefer using specific element waits over this when possible
   */
  async waitForUIUpdate(multiplier = 1): Promise<void> {
    await this.page.waitForTimeout(TIMEOUTS.UI_UPDATE * multiplier);
  }

  /**
   * Wait for a panel/modal to be hidden
   * Waits for the element to not be visible
   */
  async waitForPanelToClose(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: "hidden", timeout: TIMEOUTS.SHORT_UI_UPDATE });
  }

  /**
   * Wait for autocomplete suggestions to appear
   */
  async waitForAutocompleteSuggestion(
    suggestionSelector = '[role="option"]'
  ): Promise<void> {
    const suggestion = this.page.locator(suggestionSelector).first();
    await suggestion.waitFor({
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });
  }

  /**
   * Wait for network to be idle (useful after form submissions)
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Wait for an element to be visible and enabled
   */
  async waitForElementReady(selector: string): Promise<void> {
    const element = this.page.locator(selector);
    await element.waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });
    await element.waitFor({ state: "attached", timeout: TIMEOUTS.NAVIGATION });
  }

  /**
   * Wait for a form field to be ready (visible and enabled)
   */
  async waitForFormFieldReady(selector: string): Promise<void> {
    const field = this.page.locator(selector);
    await field.waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });
    // Wait for field to be enabled (not disabled)
    await this.page.waitForFunction(
      (sel) => {
        const el = document.querySelector(sel) as HTMLElement;
        return el && !el.hasAttribute("disabled");
      },
      selector,
      { timeout: TIMEOUTS.NAVIGATION }
    );
  }
}
