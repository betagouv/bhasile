import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Locator } from "@playwright/test";

import { expect } from "../fixtures/test";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const SAMPLE_PDF = path.resolve(
  currentDir,
  "..",
  "fixtures",
  "files",
  "sample.pdf"
);

export const uploadToContainer = async (
  container: Locator,
  filePath: string = SAMPLE_PDF
): Promise<void> => {
  const page = container.page();
  const fileInput = container.locator('input[type="file"]');
  const fileName = path.basename(filePath);

  const uploadResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/files") &&
      response.request().method() === "POST" &&
      response.ok(),
    { timeout: 30000 }
  );

  await fileInput.setInputFiles(filePath);
  await uploadResponse;

  await expect(container.getByRole("link", { name: fileName })).toBeVisible({
    timeout: 30000,
  });
};
