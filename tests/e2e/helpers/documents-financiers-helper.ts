import path from "node:path";

import { expect, Page } from "@playwright/test";

import { TestStructureData } from "./test-data";

export type DocumentsFinanciersMode = "ajout" | "finalisation";

export async function handleDocumentsFinanciers(
  page: Page,
  data: TestStructureData,
  mode: DocumentsFinanciersMode
) {
  const documents = data.documentsFinanciers?.files ?? [];
  const documentsByYear = documents.reduce(
    (acc, document) => {
      const year = Number(document.year);
      acc[year] = acc[year] || [];
      acc[year].push(document);
      return acc;
    },
    {} as Record<number, TestStructureData["documentsFinanciers"]["files"]>
  );

  const years = Object.keys(documentsByYear)
    .map((year) => Number(year))
    .sort((a, b) => b - a);

  for (const year of years) {
    const fieldset = await getYearFieldset(page, year);
    for (const document of documentsByYear[year]) {
      const formKind = document.formKind ?? "ajout";
      const isImported = await isDocumentImported(fieldset, document.category);

      if (mode === "ajout") {
        if (formKind === "ajout" && !isImported) {
          await addDocumentViaDropzone(fieldset, document);
        }
        continue;
      }

      if (formKind === "ajout") {
        const categoryButton = getCategoryButton(fieldset, document.category);
        await expect(categoryButton).toContainText("Importé");
        continue;
      }

      if (!isImported) {
        await addDocumentViaDropzone(fieldset, document);
      }
    }
  }
}

const getYearFieldset = async (page: Page, year: number) => {
  const heading = page.getByRole("heading", {
    name: String(year),
    level: 2,
  });
  await expect(heading).toBeVisible();
  const primary = heading.locator("..");
  if ((await primary.getByRole("button").count()) > 0) {
    return primary;
  }
  const fallback = primary.locator("..");
  return fallback;
};

const isDocumentImported = async (
  fieldset: ReturnType<Page["locator"]>,
  label: string
) => {
  const categoryButton = getCategoryButton(fieldset, label);
  if ((await categoryButton.count()) === 0) {
    return false;
  }
  const texts = await categoryButton.allTextContents();
  return texts.some((text) => text.includes("Importé"));
};

const addDocumentViaDropzone = async (
  fieldset: ReturnType<Page["locator"]>,
  document: TestStructureData["documentsFinanciers"]["files"][number]
) => {
  const fileInput = fieldset.locator('input[type="file"]').first();
  await fileInput.setInputFiles(path.join(process.cwd(), document.filePath));

  const categorySelect = fieldset.getByRole("combobox", {
    name: "Type de document",
  });
  await expect(categorySelect).toBeVisible();
  await categorySelect.selectOption({ label: document.category });

  const addButton = fieldset.getByRole("button", {
    name: "Ajouter le document",
  });
  await expect(addButton).toBeEnabled();
  await addButton.click();

  const categoryButton = getCategoryButton(fieldset, document.category);
  if ((await categoryButton.count()) > 0) {
    await expect(categoryButton).toContainText("Importé");
  }
};

const getCategoryButton = (
  fieldset: ReturnType<Page["locator"]>,
  label: string
) => {
  return fieldset.locator("button").filter({ hasText: label }).first();
};
