import { describe, expect, it, vi } from "vitest";

import {
  getControleQualiteDownloadContent,
  getFinancesDownloadContent,
  getStructureDownloadContent,
  getTypePlacesDownloadContent,
} from "@/app/utils/spreadsheet-download/structure-spreadsheet-download.util";
import { StructureApiRead } from "@/schemas/api/structure.schema";

vi.mock("../date.util", () => ({
  formatDate: (date: string | Date) =>
    typeof date === "string" ? date : "01/01/2024",
  getTypePlacesYearRange: () => ({ years: [2023, 2024] }),
  getYearRange: () => ({ years: [2023, 2024] }),
}));

vi.mock("../structure.util", () => ({
  getRealCreationYear: () => 2023,
}));

vi.mock("../budget.util", () => ({
  computeResultatNet: (produits = 0, charges = 0) => produits - charges,
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

describe("structure-spreadsheet-download.util", () => {
  describe("getTypePlacesDownloadContent", () => {
    it("filtre et formate correctement les typologies de structure par année", () => {
      const content = getTypePlacesDownloadContent(mockStructure);

      expect(content.fileName).toContain("Type places BHA-TEST-001");
      expect(content.data).toHaveLength(2);
      expect(content.data[0].year).toBe(2024);
      expect(content.headersMap.placesAutorisees).toBe("Places autorisées");
    });
  });

  describe("getFinancesDownloadContent", () => {
    it("sépare correctement les données prévisionnelles et réalisées dans l'objet final", () => {
      const content = getFinancesDownloadContent(mockStructure);

      expect(content.fileName).toContain("Finances BHA-TEST-001");
      expect(content.data).toHaveLength(1);
      expect(content.data[0]).toMatchObject({
        year: 2024,
        ETPPrevisionnel: 8,
        ETPRealise: 10,
        tauxEncadrementPrevisionnel: 1.2,
        tauxEncadrementRealise: 1.5,
        coutJournalierPrevisionnel: 75,
        coutJournalierRealise: 80,
        resultatNet: 200,
        resultatNetProposeParOperateur: 150,
      });
    });

    it("laisse à undefined les valeurs de réalisé si seul le prévisionnel existe", () => {
      const structurePrevisionnelleSeule = {
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

      const content = getFinancesDownloadContent(structurePrevisionnelleSeule);

      expect(content.data).toHaveLength(1);
      expect(content.data[0]).toMatchObject({
        year: 2024,
        ETPPrevisionnel: 8,
        ETPRealise: undefined,
      });
    });
  });

  describe("getControleQualiteDownloadContent", () => {
    it("construit une structure à 3 feuilles avec les dates formatées", () => {
      const content = getControleQualiteDownloadContent(mockStructure);

      expect(content.fileName).toContain("Contrôle qualité BHA-TEST-001");
      expect(content.sheets).toHaveLength(3);

      const eigSheet = content.sheets?.[0];
      expect(eigSheet?.sheetName).toBe("Evenements Indésirables Graves");
      expect(eigSheet?.data[0].evenementDate).toBe("10/01/2024");
    });
  });

  describe("getStructureDownloadContent", () => {
    it("combine l'ensemble des onglets des autres fonctions", () => {
      const content = getStructureDownloadContent(mockStructure);

      expect(content.fileName).toContain("Structure BHA-TEST-001");
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
