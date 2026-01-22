import { expect, Page } from "@playwright/test";

import { TIMEOUTS } from "../constants";
import { SELECTORS } from "../selectors";

/**
 * Base class for all page objects
 * Provides common functionality and patterns
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  getPage(): Page {
    return this.page;
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForSelector(SELECTORS.SUBMIT_BUTTON, {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }

  protected async waitForHeading(
    name: string | RegExp,
    level?: 1 | 2 | 3 | 4 | 5 | 6
  ): Promise<void> {
    await expect(this.page.getByRole("heading", { name, level })).toBeVisible();
  }

  protected async fillIfExists(
    selector: string,
    value: string
  ): Promise<boolean> {
    const input = this.page.locator(selector);
    const count = await input.count();
    if (count > 0) {
      const isEnabled = await input.isEnabled().catch(() => false);
      if (isEnabled) {
        await input.fill(value);
        return true;
      }
    }
    return false;
  }

  protected async submitAndWaitForUrl(
    expectedUrl: string | RegExp,
    timeout = TIMEOUTS.NAVIGATION
  ): Promise<void> {
    await this.page.click(SELECTORS.SUBMIT_BUTTON);
    await this.page.waitForURL(expectedUrl, { timeout });
  }

  protected async submitByButtonText(
    buttonText: string | RegExp,
    expectedUrl: string | RegExp,
    timeout = TIMEOUTS.NAVIGATION
  ): Promise<void> {
    const submitButton = this.page.getByRole("button", { name: buttonText });
    await submitButton.click();
    await this.page.waitForURL(expectedUrl, { timeout });
  }

  protected async submitAndWaitForNavigation(
    timeout = TIMEOUTS.SUBMIT
  ): Promise<void> {
    await this.page.click(SELECTORS.SUBMIT_BUTTON);
    await this.page.waitForLoadState("networkidle", { timeout });
  }
}
