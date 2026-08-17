import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

import { downloadDocument } from "@/app/utils/spreadsheet-download.util";

vi.mock("xlsx", () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    sheet_add_aoa: vi.fn(),
    book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe("download util", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("downloadDocument", () => {
    it("génère et télécharge le fichier ODS en filtrant les colonnes et en remappant les en-têtes", async () => {
      // GIVEN
      const mockData = [
        {
          year: 2024,
          placesAutorisees: 50,
          pmr: 5,
          lgbt: 2,
          fvvTeh: 1,
          internalId: "should-be-ignored-1",
          createdAt: "2024-01-01",
        },
        {
          year: 2025,
          placesAutorisees: 60,
          pmr: 6,
          lgbt: 3,
          fvvTeh: 2,
          internalId: "should-be-ignored-2",
          createdAt: "2025-01-01",
        },
      ];

      const headersMap = {
        year: "Année",
        placesAutorisees: "Places autorisées",
        pmr: "Places PMR",
        lgbt: "Places LGBT",
        fvvTeh: "Places FVV/TEH",
      };

      const expectedFilteredData = [
        {
          year: 2024,
          placesAutorisees: 50,
          pmr: 5,
          lgbt: 2,
          fvvTeh: 1,
        },
        {
          year: 2025,
          placesAutorisees: 60,
          pmr: 6,
          lgbt: 3,
          fvvTeh: 2,
        },
      ];

      const expectedHeaders = [
        "Année",
        "Places autorisées",
        "Places PMR",
        "Places LGBT",
        "Places FVV/TEH",
      ];

      // WHEN
      await downloadDocument({
        data: mockData,
        fileName: "type-places-BHA-TEST-001",
        sheetName: "Type de places",
        headersMap,
      });

      // THEN
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
        expectedFilteredData,
        {
          header: ["year", "placesAutorisees", "pmr", "lgbt", "fvvTeh"],
        }
      );

      expect(XLSX.utils.sheet_add_aoa).toHaveBeenCalledWith(
        expect.anything(),
        [expectedHeaders],
        { origin: "A1" }
      );

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        "Type de places"
      );

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        "type-places-BHA-TEST-001.ods",
        { bookType: "ods" }
      );
    });

    it("affiche un avertissement console et n'écrit pas le fichier si les données sont vides", async () => {
      // GIVEN
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const headersMap = {
        year: "Année",
        placesAutorisees: "Places autorisées",
      };

      // WHEN
      await downloadDocument({
        data: [],
        fileName: "type-places-BHA-TEST-002",
        sheetName: "Type de places",
        headersMap,
      });

      // THEN
      expect(consoleWarnSpy).toHaveBeenCalledWith("Aucune donnée à exporter.");
      expect(XLSX.utils.json_to_sheet).not.toHaveBeenCalled();
      expect(XLSX.writeFile).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
