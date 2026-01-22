import { expect, Page } from "@playwright/test";

import { TIMEOUTS } from "./constants";

/**
 * Helper class for autocomplete interactions in e2e tests
 */
export class AutocompleteHelper {
  constructor(private page: Page) {}

  /**
   * Fill an autocomplete field and select the first suggestion
   */
  async fillAndSelectFirst(
    inputSelector: string,
    searchTerm: string,
    suggestionSelector = '[role="option"]'
  ): Promise<void> {
    // Click and fill the input
    await this.page.click(inputSelector);
    await this.page.fill(inputSelector, searchTerm);

    // Wait for suggestions to appear
    const firstSuggestion = this.page.locator(suggestionSelector).first();
    await firstSuggestion.waitFor({
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });

    // Click the first suggestion
    await firstSuggestion.click();
  }

  /**
   * Fill an autocomplete field and select a suggestion by index
   */
  async fillAndSelectByIndex(
    inputSelector: string,
    searchTerm: string,
    index: number,
    suggestionSelector = '[role="option"]'
  ): Promise<void> {
    await this.page.click(inputSelector);
    await this.page.fill(inputSelector, searchTerm);

    const suggestions = this.page.locator(suggestionSelector);
    await suggestions.nth(index).waitFor({
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });

    await suggestions.nth(index).click();
  }

  /**
   * Fill an autocomplete field and select a suggestion by text
   */
  async fillAndSelectByText(
    inputSelector: string,
    searchTerm: string,
    suggestionText: string | RegExp,
    suggestionSelector = '[role="option"]'
  ): Promise<void> {
    await this.page.click(inputSelector);
    await this.page.fill(inputSelector, searchTerm);

    const suggestion = this.page
      .locator(suggestionSelector)
      .filter({ hasText: suggestionText })
      .first();
    await suggestion.waitFor({
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });

    await suggestion.click();
  }

  /**
   * Wait for autocomplete suggestions to appear
   */
  async waitForSuggestions(
    suggestionSelector = '[role="option"]'
  ): Promise<void> {
    const firstSuggestion = this.page.locator(suggestionSelector).first();
    await firstSuggestion.waitFor({
      state: "visible",
      timeout: TIMEOUTS.AUTOCOMPLETE,
    });
  }

  /**
   * Get all visible suggestion texts
   */
  async getSuggestionTexts(
    suggestionSelector = '[role="option"]'
  ): Promise<string[]> {
    const suggestions = this.page.locator(suggestionSelector);
    const count = await suggestions.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await suggestions.nth(i).textContent();
      if (text) {
        texts.push(text.trim());
      }
    }
    return texts;
  }

  /**
   * Verify a suggestion is visible
   */
  async expectSuggestionVisible(
    suggestionText: string | RegExp,
    suggestionSelector = '[role="option"]'
  ): Promise<void> {
    const suggestion = this.page
      .locator(suggestionSelector)
      .filter({ hasText: suggestionText })
      .first();
    await expect(suggestion).toBeVisible({ timeout: TIMEOUTS.AUTOCOMPLETE });
  }
}
