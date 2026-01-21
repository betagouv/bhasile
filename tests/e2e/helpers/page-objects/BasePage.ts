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

  /**
   * Assert that validation errors are present on the page
   */
  protected async expectValidationErrors(
    expectedErrors: string[]
  ): Promise<void> {
    for (const errorText of expectedErrors) {
      await expect(
        this.page.getByText(errorText, { exact: false })
      ).toBeVisible({ timeout: TIMEOUTS.NAVIGATION });
    }
  }

  /**
   * Assert that a specific field has an error state
   */
  protected async expectFieldError(selector: string): Promise<void> {
    const field = this.page.locator(selector);
    // Check for aria-invalid attribute or error styling
    const hasAriaInvalid = await field.getAttribute("aria-invalid");
    const hasErrorClass = await field.evaluate((el) =>
      el.classList.contains("border-red-500")
    );

    if (hasAriaInvalid !== "true" && !hasErrorClass) {
      // Also check parent for error state
      const parent = field.locator("..");
      const parentHasError = await parent.evaluate((el) =>
        el.classList.contains("border-red-500")
      );
      if (!parentHasError) {
        throw new Error(`Field ${selector} does not have error state`);
      }
    }
  }

  /**
   * Attempt to submit and expect to stay on current page (validation failure)
   */
  protected async attemptSubmitAndExpectValidationFailure(
    currentUrlPattern: string | RegExp
  ): Promise<void> {
    const initialUrl = this.page.url();
    await this.page.click('button[type="submit"]');

    // Wait a moment - navigation should NOT happen
    await this.page.waitForTimeout(TIMEOUTS.UI_UPDATE);

    // Should still be on the same page
    const currentUrl = this.page.url();
    if (typeof currentUrlPattern === "string") {
      expect(currentUrl).toContain(currentUrlPattern);
    } else {
      expect(currentUrl).toMatch(currentUrlPattern);
    }

    // URL should not have changed (no navigation occurred)
    expect(currentUrl).toBe(initialUrl);
  }
}
