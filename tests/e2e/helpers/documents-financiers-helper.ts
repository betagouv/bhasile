import path from "node:path";

import { expect, Page } from "@playwright/test";

import { ElementNotFoundError, formatErrorMessage } from "./error-handler";
import { TestStructureData } from "./test-data/types";

export type DocumentsFinanciersMode = "ajout" | "finalisation";

export async function handleDocumentsFinanciers(
  page: Page,
  data: TestStructureData,
  mode: DocumentsFinanciersMode
) {
  const documents = data.documentsFinanciers?.fileUploads ?? [];
  const documentsByYear = documents.reduce(
    (acc, document) => {
      const year = Number(document.year);
      acc[year] = acc[year] || [];
      acc[year].push(document);
      return acc;
    },
    {} as Record<
      number,
      TestStructureData["documentsFinanciers"]["fileUploads"]
    >
  );

  const years = Object.keys(documentsByYear)
    .map((year) => Number(year))
    .sort((a, b) => b - a);

  for (const year of years) {
    const container = await getYearContainer(page, year);
    for (const document of documentsByYear[year]) {
      const formKind = document.formKind ?? "ajout";
      const shouldAdd =
        (mode === "ajout" && formKind === "ajout") ||
        (mode === "finalisation" && formKind === "finalisation");
      const shouldRequireImported =
        mode === "finalisation" && formKind === "ajout";

      const isImported = await isDocumentImported(container, document.category);

      if (shouldRequireImported) {
        if (!isImported) {
          await expectDocumentImported(container, document.category, year);
        }
        continue;
      }

      if (shouldAdd && !isImported) {
        await addDocumentViaDropzone(container, document);
      }
    }
  }
}

const getYearContainer = async (page: Page, year: number) => {
  const heading = page.getByRole("heading", {
    name: String(year),
    level: 2,
  });
  await expect(heading).toBeVisible();
  const fieldset = page.locator("fieldset").filter({ has: heading }).first();
  if ((await fieldset.count()) > 0) {
    await expect(fieldset).toBeVisible();
    return fieldset;
  }
  const fallback = heading.locator("..");
  await expect(fallback).toBeVisible();
  return fallback;
};

const isDocumentImported = async (
  container: ReturnType<Page["locator"]>,
  label: string
) => {
  const categoryButton = getCategoryButton(container, label);
  if ((await categoryButton.count()) === 0) {
    return false;
  }
  const texts = await categoryButton.allTextContents();
  return texts.some((text) => text.includes("Importé"));
};

const addDocumentViaDropzone = async (
  container: ReturnType<Page["locator"]>,
  document: TestStructureData["documentsFinanciers"]["fileUploads"][number]
) => {
  const fileInput = container.locator('input[type="file"]').first();
  await fileInput.setInputFiles(path.join(process.cwd(), document.filePath));

  const categorySelect = container.getByRole("combobox", {
    name: "Type de document",
  });
  await expect(categorySelect).toBeVisible();
  await categorySelect.selectOption({ label: document.category });

  const addButton = container.getByRole("button", {
    name: "Ajouter le document",
  });
  await expect(addButton).toBeEnabled();
  await addButton.click();

  await expectDocumentImported(container, document.category);
};

const getCategoryButton = (
  container: ReturnType<Page["locator"]>,
  label: string
) => {
  return container.locator("button").filter({ hasText: label }).first();
};

const expectDocumentImported = async (
  container: ReturnType<Page["locator"]>,
  label: string,
  year?: number
) => {
  const categoryButton = getCategoryButton(container, label);
  if ((await categoryButton.count()) === 0) {
    const context = year
      ? formatErrorMessage(
          "Document financier introuvable",
          `year ${year}`,
          label
        )
      : formatErrorMessage("Document financier introuvable", undefined, label);
    throw new ElementNotFoundError(label, context);
  }
  await expect(categoryButton).toContainText("Importé");
};
