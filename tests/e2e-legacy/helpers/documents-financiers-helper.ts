import path from "node:path";

import { expect, Page } from "@playwright/test";

import { TIMEOUTS } from "./constants";
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
        await addDocumentToBox(container, document);
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
  return heading.locator("xpath=..");
};

const getDocumentBox = (
  container: ReturnType<Page["locator"]>,
  label: string
) => container.getByRole("group", { name: label, exact: true });

const getDeleteFileButton = (
  container: ReturnType<Page["locator"]>,
  label: string
) =>
  getDocumentBox(container, label).getByRole("button", { name: /^Supprimer / });

const isDocumentImported = async (
  container: ReturnType<Page["locator"]>,
  label: string
) => (await getDeleteFileButton(container, label).count()) > 0;

const addDocumentToBox = async (
  container: ReturnType<Page["locator"]>,
  document: TestStructureData["documentsFinanciers"]["fileUploads"][number]
) => {
  const fileInput = getDocumentBox(container, document.category).locator(
    'input[type="file"]'
  );
  await fileInput.setInputFiles(path.join(process.cwd(), document.filePath));

  await expect(getDeleteFileButton(container, document.category)).toBeVisible({
    timeout: TIMEOUTS.FILE_UPLOAD,
  });
};

const expectDocumentImported = async (
  container: ReturnType<Page["locator"]>,
  label: string,
  year?: number
) => {
  if ((await getDocumentBox(container, label).count()) === 0) {
    const context = year
      ? formatErrorMessage(
          "Document financier introuvable",
          `year ${year}`,
          label
        )
      : formatErrorMessage("Document financier introuvable", undefined, label);
    throw new ElementNotFoundError(label, context);
  }
  await expect(getDeleteFileButton(container, label)).toBeVisible();
};
