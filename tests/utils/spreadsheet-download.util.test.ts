import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";

import { downloadDocument } from "@/app/utils/spreadsheet-download/spreadsheet-download.util";
import {
  getControleQualiteDownloadContent,
  getFinancesDownloadContent,
  getStructureDownloadContent,
  getTypePlacesDownloadContent,
} from "@/app/utils/spreadsheet-download/structure-spreadsheet-download.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";

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

const mockStructure = {
  codeBhasile: "BHA-TEST-001",
  structureTypologies: [
    { year: 2024, placesAutorisees: 50, pmr: 5, lgbt: 2, fvvTeh: 1 },
    { year: 2023, placesAutorisees: 40, pmr: 4, lgbt: 1, fvvTeh: 0 },
  ],
  indicateursFinanciers: [
    {
      year: 2024,
      type: "REALISE",
      ETP: 10,
      tauxEncadrement: 1.5,
      coutJournalier: 80,
    },
    {
      year: 2024,
      type: "PREVISIONNEL",
      ETP: 8,
      tauxEncadrement: 1.2,
      coutJournalier: 75,
    },
  ],
  budgets: [
    {
      year: 2024,
      totalProduits: 1000,
      totalCharges: 800,
      totalProduitsProposes: 900,
      totalChargesProposees: 750,
    },
  ],
  evenementsIndesirablesGraves: [
    {
      numeroDossier: "EIG-001",
      evenementDate: "2024-01-10",
      declarationDate: "2024-01-11",
      type: "Agression",
    },
  ],
  evaluations: [
    {
      date: "2024-02-01",
      notePersonne: 4,
      notePro: 4.5,
      noteStructure: 4.2,
      note: 4.23,
    },
  ],
  controles: [
    {
      date: "2024-03-01",
      type: "Inspection inopinée",
    },
  ],
} as unknown as StructureApiRead;

describe("download util", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("downloadDocument", () => {
    it("génère et télécharge le fichier ODS mono-feuillet", async () => {
      const mockData = [
        {
          year: 2024,
          placesAutorisees: 50,
          pmr: 5,
          lgbt: 2,
          fvvTeh: 1,
          internalId: "should-be-ignored-1",
        },
      ];

      const headersMap = {
        year: "Année",
        placesAutorisees: "Places autorisées",
        pmr: "Places PMR",
        lgbt: "Places LGBT",
        fvvTeh: "Places FVV/TEH",
      };

      await downloadDocument({
        data: mockData,
        fileName: "type-places-BHA-TEST-001",
        sheetName: "Type de places",
        headersMap,
      });

      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(
        [
          {
            year: 2024,
            placesAutorisees: 50,
            pmr: 5,
            lgbt: 2,
            fvvTeh: 1,
          },
        ],
        { header: ["year", "placesAutorisees", "pmr", "lgbt", "fvvTeh"] }
      );

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        "type-places-BHA-TEST-001.ods",
        { bookType: "ods" }
      );
    });

    it("génère un document multi-feuillets via la propriété sheets", async () => {
      const options = getControleQualiteDownloadContent(mockStructure);

      await downloadDocument(options);

      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(3);
      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        "controle-qualite-BHA-TEST-001.ods",
        { bookType: "ods" }
      );
    });

    it("génère une feuille avec le message d'absence de données si la liste est vide", async () => {
      const emptyStructure = {
        ...mockStructure,
        evenementsIndesirablesGraves: [],
      };

      const options = getControleQualiteDownloadContent(emptyStructure);

      await downloadDocument(options);

      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith([
        ["Pas de données pour les EIG"],
      ]);
    });

    it("affiche un avertissement console si aucune feuille ni donnée n'est fournie", async () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      await downloadDocument({
        fileName: "test-vide",
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Aucune donnée ni feuille à exporter."
      );
      expect(XLSX.writeFile).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe("getTypePlacesDownloadContent", () => {
    it("filtre et formate correctement les typologies de structure par année", () => {
      const content = getTypePlacesDownloadContent(mockStructure);

      expect(content.fileName).toBe("type-places-BHA-TEST-001");
      expect(content.data).toHaveLength(2);
      expect(content.data[0].year).toBe(2024);
      expect(content.headersMap.placesAutorisees).toBe("Places autorisées");
    });
  });

  describe("getFinancesDownloadContent", () => {
    it("sélectionne en priorité l'indicateur REALISE s'il est présent", () => {
      const content = getFinancesDownloadContent(mockStructure);

      expect(content.fileName).toBe("finances-BHA-TEST-001");
      expect(content.data).toHaveLength(1);
      expect(content.data[0]).toMatchObject({
        year: 2024,
        type: "REALISE",
        ETP: 10,
        resultatNet: 200,
        resultatNetProposeParOperateur: 150,
      });
    });

    it("sélectionne l'indicateur PREVISIONNEL si l'année n'est pas réalisée", () => {
      const structurePrevisionnelle = {
        ...mockStructure,
        indicateursFinanciers: [
          {
            year: 2024,
            type: "PREVISIONNEL",
            ETP: 8,
            tauxEncadrement: 1.2,
            coutJournalier: 75,
          },
        ],
      } as unknown as StructureApiRead;

      const content = getFinancesDownloadContent(structurePrevisionnelle);

      expect(content.data).toHaveLength(1);
      expect(content.data[0]).toMatchObject({
        year: 2024,
        type: "PREVISIONNEL",
        ETP: 8,
      });
    });
  });

  describe("getControleQualiteDownloadContent", () => {
    it("construit une structure à 3 feuilles avec les dates formatées", () => {
      const content = getControleQualiteDownloadContent(mockStructure);

      expect(content.fileName).toBe("controle-qualite-BHA-TEST-001");
      expect(content.sheets).toHaveLength(3);

      const eigSheet = content.sheets?.[0];
      expect(eigSheet?.sheetName).toBe("Evenements Indésirables Graves");
      expect(eigSheet?.data[0].evenementDate).toBe("10/01/2024");
    });
  });

  describe("getStructureDownloadContent", () => {
    it("combine l'ensemble des onglets des autres fonctions", () => {
      const content = getStructureDownloadContent(mockStructure);

      expect(content.fileName).toBe("structure-BHA-TEST-001");
      expect(content.sheets).toHaveLength(5);
      expect(content.sheets?.[0].sheetName).toBe("Type de places");
      expect(content.sheets?.[1].sheetName).toBe("Finances");
      expect(content.sheets?.[2].sheetName).toBe(
        "Evenements Indésirables Graves"
      );
      expect(content.sheets?.[3].sheetName).toBe("Evaluations");
      expect(content.sheets?.[4].sheetName).toBe("Inspections-contrôles");
    });
  });
});
