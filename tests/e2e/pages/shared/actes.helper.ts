import type { Locator, Page } from "@playwright/test";

import { SAMPLE_PDF, uploadContainer, uploadToContainer } from "../upload.helper";

/** Scope un acte par le texte de sa légende de fieldset. */
export const acteFieldsetByLegend = (page: Page, legend: string): Locator =>
  page.locator(`fieldset:has(> legend:has-text("${legend}"))`);

export const fillActeStartEndDates = async (
  scope: Locator,
  startDate: string,
  endDate: string
): Promise<void> => {
  await scope.locator('input[name$=".startDate"]').first().fill(startDate);
  await scope.locator('input[name$=".endDate"]').first().fill(endDate);
};

export const fillActeDate = async (
  scope: Locator,
  date: string
): Promise<void> => {
  await scope.locator('input[name$=".date"]').first().fill(date);
};

export const fillActeName = async (
  scope: Locator,
  name: string
): Promise<void> => {
  await scope.locator('input[name$=".name"]').first().fill(name);
};

export const uploadActeDocument = async (
  scope: Locator,
  filePath: string = SAMPLE_PDF
): Promise<void> => {
  await uploadToContainer(uploadContainer(scope).first(), filePath);
};
