import { expect, test } from "@playwright/test";

import { CheckboxHelper } from "./helpers/checkbox-helper";
import { WaitHelper } from "./helpers/wait-helper";

test.describe("Structures filters and ordering", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to structures page
    await page.goto("http://localhost:3000/structures");
    await page.waitForLoadState("networkidle");
  });

  test("should filter structures by excluding a type when clicking checkbox", async ({
    page,
  }) => {
    // Click filters button (use aria-label to distinguish from location filter button)
    await page
      .getByRole("button", { name: /^Filtres (actifs|inactifs)$/ })
      .click();

    // When no filter is selected, all checkboxes appear checked
    // Clicking CADA will uncheck it and exclude CADA structures
    const checkboxHelper = new CheckboxHelper(page);
    await checkboxHelper.clickByValue("CADA");

    // Wait for URL to update
    await page.waitForURL(/.*type=.*/);

    // Wait for the table to update
    await page.waitForLoadState("networkidle");

    // Verify URL reflects the filter (excludes CADA)
    expect(page.url()).toContain("type=");
    expect(page.url()).not.toContain("CADA");

    // Verify no CADA structures are shown
    const cadaCells = page.locator('tbody tr td[aria-label="CADA"]');
    await expect(cadaCells).toHaveCount(0);
  });

  test("should order structures by DNA code ascending", async ({ page }) => {
    // Click the DNA column ordering button
    const dnaHeader = page.getByRole("columnheader", { name: /DNA/i });
    // Find the ordering button by aria-label (starts with "Trier par")
    const orderButton = dnaHeader.getByRole("button", { name: /Trier par/i });
    await orderButton.click();

    // Wait for URL to update with ordering params
    await page.waitForURL(/.*column=dnaCode.*direction=asc.*/);

    // Verify URL contains ordering params
    expect(page.url()).toContain("column=dnaCode");
    expect(page.url()).toContain("direction=asc");

    // Verify structures are ordered correctly
    const dnaCodes = await page
      .locator("tbody tr td:first-child")
      .allTextContents();
    const sortedDnaCodes = [...dnaCodes].sort();
    expect(dnaCodes).toEqual(sortedDnaCodes);
  });

  test("should toggle ordering direction", async ({ page }) => {
    // Click once for ascending
    const typeHeader = page.getByRole("columnheader", { name: /Type/i });
    const orderButton = typeHeader.getByRole("button", { name: /Trier par/i });
    await orderButton.click();
    await page.waitForURL(/.*direction=asc.*/);

    expect(page.url()).toContain("direction=asc");

    // Click again for descending
    await orderButton.click();
    await page.waitForURL(/.*direction=desc.*/);

    expect(page.url()).toContain("direction=desc");

    // Click again to clear ordering - button label changes to "Supprimer le tri"
    const clearButton = typeHeader.getByRole("button", {
      name: /Supprimer le tri/i,
    });
    await clearButton.click();
    // Wait for URL to not contain column or direction
    await page.waitForFunction(() => {
      const url = window.location.href;
      return !url.includes("column=") && !url.includes("direction=");
    });

    expect(page.url()).not.toContain("column=");
    expect(page.url()).not.toContain("direction=");
  });

  test("should combine type exclusion with ordering", async ({ page }) => {
    // First, exclude CADA type
    await page
      .getByRole("button", { name: /^Filtres (actifs|inactifs)$/ })
      .click();
    const checkboxHelper = new CheckboxHelper(page);
    await checkboxHelper.clickByValue("CADA");
    // Close the filters panel by clicking outside
    await page.click("body");
    await page.waitForLoadState("networkidle");

    // Then apply ordering
    // Wait for filters panel to be hidden
    const waitHelper = new WaitHelper(page);
    await waitHelper.waitForUIUpdate();
    const operateurHeader = page.getByRole("columnheader", {
      name: /Opérateur/i,
    });
    const orderButton = operateurHeader.getByRole("button", {
      name: /Trier par/i,
    });
    await orderButton.click();
    await page.waitForURL(/.*column=operateur.*direction=asc.*/);

    // Verify both filter and ordering are in URL
    expect(page.url()).toContain("type=");
    expect(page.url()).not.toContain("CADA");
    expect(page.url()).toContain("column=operateur");
    expect(page.url()).toContain("direction=asc");

    // Verify no CADA structures are shown
    const cadaCells = page.locator('tbody tr td[aria-label="CADA"]');
    await expect(cadaCells).toHaveCount(0);
  });

  test("should persist filters and ordering in URL on page refresh", async ({
    page,
  }) => {
    // Apply filters (exclude CADA) and ordering
    await page
      .getByRole("button", { name: /^Filtres (actifs|inactifs)$/ })
      .click();
    const checkboxHelper = new CheckboxHelper(page);
    await checkboxHelper.clickByValue("CADA");

    // Wait for filters panel to close
    const waitHelper = new WaitHelper(page);
    await waitHelper.waitForUIUpdate();
    const dnaHeader = page.getByRole("columnheader", { name: /DNA/i });
    const orderButton = dnaHeader.getByRole("button", { name: /Trier par/i });
    await orderButton.click();
    await page.waitForURL(/.*column=dnaCode.*direction=asc.*/);

    const url = page.url();

    // Refresh page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify filters and ordering are still applied
    expect(page.url()).toBe(url);

    // Verify active indicators are shown
    const filterButton = page.getByRole("button", {
      name: /^Filtres (actifs|inactifs)$/,
    });
    const indicator = filterButton.locator(
      "span .bg-border-action-high-warning"
    );
    await expect(indicator).toBeVisible();

    // Verify no CADA structures are still shown
    const cadaCells = page.locator('tbody tr td[aria-label="CADA"]');
    await expect(cadaCells).toHaveCount(0);
  });
});
