import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

import { downloadDocument } from "@/app/utils/spreadsheet-download/spreadsheet-download.util";

vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    aoa_to_sheet: vi.fn(() => ({})),
    sheet_add_aoa: vi.fn(),
    book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe("downloadDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("génère et télécharge le fichier ODS mono-feuillet", async () => {
    const mockData = [
      {
        year: 2024,
        placesAutorisees: 50,
        pmr: 5,
        internalId: "should-be-ignored-1",
      },
    ];

    const headersMap = {
      year: "Année",
      placesAutorisees: "Places autorisées",
      pmr: "Places PMR",
    };

    await downloadDocument({
      data: mockData,
      fileName: "test-mono-feuillet",
      sheetName: "Type de places",
      headersMap,
    });

    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
      [
        {
          year: 2024,
          placesAutorisees: 50,
          pmr: 5,
        },
      ],
      { header: ["year", "placesAutorisees", "pmr"] }
    );

    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      "test-mono-feuillet.ods",
      { bookType: "ods" }
    );
  });

  it("génère un document multi-feuillets via la propriété sheets", async () => {
    await downloadDocument({
      fileName: "test-multi-feuillets",
      sheets: [
        {
          sheetName: "Feuille 1",
          data: [{ col1: "val1" }],
          headersMap: { col1: "Colonne 1" },
        },
        {
          sheetName: "Feuille 2",
          data: [{ col2: "val2" }],
          headersMap: { col2: "Colonne 2" },
        },
      ],
    });

    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(2);
    expect(XLSX.writeFile).toHaveBeenCalledWith(
      expect.anything(),
      "test-multi-feuillets.ods",
      { bookType: "ods" }
    );
  });

  it("génère une feuille avec le message d'absence de données si la liste est vide", async () => {
    await downloadDocument({
      fileName: "test-vide",
      sheets: [
        {
          sheetName: "Feuille Vide",
          data: [],
          headersMap: { col1: "Colonne 1" },
          emptyMessage: "Aucune donnée disponible",
        },
      ],
    });

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
      ["Aucune donnée disponible"],
    ]);
  });

  it("affiche un avertissement console si aucune feuille ni donnée n'est fournie", async () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    await downloadDocument({
      fileName: "test-sans-donnees",
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Aucune donnée ni feuille à exporter."
    );
    expect(XLSX.writeFile).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });
});
