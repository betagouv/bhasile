import { expect, Page } from "@playwright/test";

import { TIMEOUTS } from "../constants";

/**
 * Base class for all page objects
 * Provides common functionality and patterns
 */
export abstract class BasePage {
  constructor(protected page: Page) {}

  /**
   * Get the page instance (for cases where direct access is needed)
   */
  getPage(): Page {
    return this.page;
  }

  /**
   * Wait for the page to be ready (typically the submit button)
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }

  /**
   * Wait for a heading to be visible
   */
  protected async waitForHeading(
    name: string | RegExp,
    level?: 1 | 2 | 3 | 4 | 5 | 6
  ): Promise<void> {
    await expect(this.page.getByRole("heading", { name, level })).toBeVisible();
  }

  /**
   * Fill an input field if it exists
   */
  protected async fillIfExists(
    selector: string,
    value: string
  ): Promise<boolean> {
    const input = this.page.locator(selector);
    if ((await input.count()) > 0 && (await input.isEnabled())) {
      await input.fill(value);
      return true;
    }
    return false;
  }

  /**
   * Click submit button and wait for navigation
   */
  protected async submitAndWaitForUrl(
    expectedUrl: string | RegExp,
    timeout = TIMEOUTS.NAVIGATION
  ): Promise<void> {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(expectedUrl, { timeout });
  }
}
