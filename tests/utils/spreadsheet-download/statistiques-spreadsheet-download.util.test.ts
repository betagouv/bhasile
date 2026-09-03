import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getStatistiquesDownloadContent } from "@/app/utils/spreadsheet-download/statistiques-spreadsheet-download.util";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

vi.mock("../date.util", () => ({
  formatDate: (date: string | number | Date) => {
    if (typeof date === "number" || date instanceof Date) {
      return "01/09/2026";
    }
    return date;
  },
}));

vi.mock("../number.util", () => ({
  formatPercentage: (value: number) => `${value * 100}%`,
}));

vi.mock("../budget.util", () => ({
  computeResultatNet: (produits = 0, charges = 0) => produits - charges,
}));

const mockStatistiques = {
  structures: {
    byYear: [
      {
        year: 2024,
        totalStructures: 10,
        totalCpoms: 8,
        structuresCada: 5,
        structuresCph: 2,
        structuresHuda: 1,
        structuresCaes: 2,
        structuresBatiCollectif: 4,
        structuresBatiDiffus: 4,
        structuresBatiMixte: 2,
      },
    ],
  },
  places: {
    byYear: [
      {
        year: 2024,
        totalPlaces: 500,
        tauxEquipement: 0.025,
        pmr: 10,
        lgbt: 5,
        fvvTeh: 2,
      },
    ],
  },
  finance: {
    byYear: [
      {
        year: 2024,
        total: {
          totalETP: 20,
          tauxEncadrement: 1.5,
          coutJournalier: 85,
          dotationDemandee: 100000,
          dotationAccordee: 90000,
          totalProduits: 100000,
          totalCharges: 95000,
        },
        autorisees: {
          totalETP: 15,
          tauxEncadrement: 1.2,
          coutJournalier: 80,
          dotationDemandee: 80000,
          dotationAccordee: 75000,
          totalProduits: 80000,
          totalCharges: 78000,
        },
        subventionnees: {
          totalETP: 5,
          tauxEncadrement: 0.3,
          coutJournalier: 5,
          dotationDemandee: 20000,
          dotationAccordee: 15000,
          totalProduits: 20000,
          totalCharges: 17000,
        },
      },
    ],
  },
  controleQualite: {
    byMonth: [
      {
        date: "2024-01",
        nbStructuresSansDeclarationEig: 5,
        nbEig: 12,
        nbEigComportementViolent: 3,
        tauxEigComportementViolent: 0.25,
        nbStructuresEvaluees: 8,
        noteGenerale: 4.2,
        notePersonne: 4.5,
        notePro: 4.1,
        noteStructure: 4.0,
      },
    ],
  },
  activite: {
    byMonth: [
      {
        date: "2024-01",
        placesEnregistreesDna: 450,
        placesIndisponibles: 10,
        presencesInduesBPI: 5,
        tauxPresencesInduesBPI: 0.02,
        presencesInduesDeboutees: 8,
        tauxPresencesInduesDeboutees: 0.03,
        presencesInduesTotal: 13,
        tauxPresencesInduesTotal: 0.05,
      },
    ],
  },
  rmu: {
    byMonth: [
      {
        date: "2024-01",
        referesEngages: 10,
        referesExecutes: 8,
        tauxExecute: 0.8,
      },
    ],
  },
} as unknown as StatistiqueApiRead;

describe("statistiques-spreadsheet-download.util", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getStatistiquesDownloadContent", () => {
    it("génère le bon nom de fichier par défaut (sans filtres)", () => {
      const content = getStatistiquesDownloadContent(mockStatistiques);

      expect(content.fileName).toBe("Statistiques 01-09-2026");
      expect(content.sheets).toHaveLength(8);
    });

    it("ajoute 'personnalisées' dans le nom de fichier quand des filtres sont appliqués", () => {
      const content = getStatistiquesDownloadContent(mockStatistiques, true);

      expect(content.fileName).toBe("Statistiques personnalisées 01-09-2026");
    });

    it("formate correctement la feuille 'Structures'", () => {
      const content = getStatistiquesDownloadContent(mockStatistiques);
      const sheet = content.sheets?.[0];

      expect(sheet?.sheetName).toBe("Structures");
      expect(sheet?.data).toHaveLength(1);
      expect(sheet?.data[0]).toMatchObject({
        year: 2024,
        totalStructures: 10,
      });
      expect(sheet?.headersMap.totalStructures).toBe("Structures");
    });

    it("multiplie le taux d'équipement par 1000 dans la feuille 'Types de places'", () => {
      const content = getStatistiquesDownloadContent(mockStatistiques);
      const sheet = content.sheets?.[1];

      expect(sheet?.sheetName).toBe("Types de places");
      expect(sheet?.data[0]).toMatchObject({
        year: 2024,
        totalPlaces: 500,
        tauxEquipement: 25,
      });
      expect(sheet?.headersMap.tauxEquipement).toBe("Taux d'équipement (‰)");
    });

    it("calcule correctement le resultatNet pour les 3 feuilles financières", () => {
      const content = getStatistiquesDownloadContent(mockStatistiques);

      const financeTotalSheet = content.sheets?.[2];
      const financeAutoriseeSheet = content.sheets?.[3];
      const financeSubventionneeSheet = content.sheets?.[4];

      expect(financeTotalSheet?.sheetName).toBe("Finance (total)");
      expect(financeTotalSheet?.data[0]).toMatchObject({
        year: 2024,
        totalETP: 20,
        resultatNet: 5000,
      });

      expect(financeAutoriseeSheet?.sheetName).toBe("Finance (autorisées)");
      expect(financeAutoriseeSheet?.data[0]).toMatchObject({
        year: 2024,
        totalETP: 15,
        resultatNet: 2000,
      });

      expect(financeSubventionneeSheet?.sheetName).toBe(
        "Finance (subventionnées)"
      );
      expect(financeSubventionneeSheet?.data[0]).toMatchObject({
        year: 2024,
        totalETP: 5,
        resultatNet: 3000,
      });
    });

    it("formate la date et les pourcentages pour la feuille 'Contrôle qualité'", () => {
      const content = getStatistiquesDownloadContent(mockStatistiques);
      const sheet = content.sheets?.[5];

      expect(sheet?.sheetName).toBe("Contrôle qualité");
      expect(sheet?.data[0]).toMatchObject({
        date: "01/01/2024",
        tauxEigComportementViolent: "25 %",
      });
      expect(sheet?.headersMap.nbEig).toBe("Tous les EIG");
    });

    it("formate les taux de présences indues dans la feuille 'Activité (OFII)'", () => {
      const content = getStatistiquesDownloadContent(mockStatistiques);
      const sheet = content.sheets?.[6];

      expect(sheet?.sheetName).toBe("Activité (OFII)");
      expect(sheet?.data[0]).toMatchObject({
        date: "01/01/2024",
        tauxPresencesInduesBPI: "2 %",
        tauxPresencesInduesDeboutees: "3 %",
        tauxPresencesInduesTotal: "5 %",
      });
    });

    it("formate le taux de RMU exécuté dans la feuille 'Référés Mesures Utiles'", () => {
      const content = getStatistiquesDownloadContent(mockStatistiques);
      const sheet = content.sheets?.[7];

      expect(sheet?.sheetName).toBe("Référés Mesures Utiles");
      expect(sheet?.data[0]).toMatchObject({
        date: "01/01/2024",
        referesEngages: 10,
        referesExecutes: 8,
        tauxExecute: "80 %",
      });
    });

    it("renvoie un tableau vide pour la feuille 'Référés Mesures Utiles' si rmu est undefined", () => {
      const statistiquesSansRmu = {
        ...mockStatistiques,
        rmu: undefined,
      } as unknown as StatistiqueApiRead;

      const content = getStatistiquesDownloadContent(statistiquesSansRmu);
      const sheet = content.sheets?.[7];

      expect(sheet?.sheetName).toBe("Référés Mesures Utiles");
      expect(sheet?.data).toEqual([]);
    });
  });
});
