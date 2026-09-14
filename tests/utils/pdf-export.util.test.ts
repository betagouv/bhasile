import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  computeStartMonth,
  getPdfExportPayload,
  toYearMonth,
} from "@/app/utils/pdf-export.util";

describe("pdf-export util", () => {
  describe("toYearMonth", () => {
    it("formate correctement une date au format YYYY-MM", () => {
      expect(toYearMonth(new Date(2023, 0, 15))).toBe("2023-01");
      expect(toYearMonth(new Date(2023, 11, 31))).toBe("2023-12");
    });

    it("ajoute un zéro initial pour les mois à un seul chiffre", () => {
      expect(toYearMonth(new Date(2024, 4, 1))).toBe("2024-05");
      expect(toYearMonth(new Date(2024, 8, 9))).toBe("2024-09");
    });

    it("gère correctement le changement d'année", () => {
      expect(toYearMonth(new Date(1999, 11, 1))).toBe("1999-12");
      expect(toYearMonth(new Date(2000, 0, 1))).toBe("2000-01");
    });
  });

  describe("computeStartMonth", () => {
    it("calcule correctement le mois de début en soustrayant 5 mois", () => {
      expect(computeStartMonth("2024-06")).toBe("2024-01");
      expect(computeStartMonth("2024-12")).toBe("2024-07");
    });

    it("gère le chevauchement sur l'année précédente", () => {
      expect(computeStartMonth("2024-05")).toBe("2023-12");
      expect(computeStartMonth("2024-01")).toBe("2023-08");
      expect(computeStartMonth("2024-03")).toBe("2023-10");
    });

    it("retourne une chaîne vide si la valeur d'entrée est absente ou vide", () => {
      expect(computeStartMonth("")).toBe("");
      expect(computeStartMonth(null as unknown as string)).toBe("");
      expect(computeStartMonth(undefined as unknown as string)).toBe("");
    });
  });

  describe("getPdfExportPayload", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 5, 15));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("se rabat sur la date actuelle lorsque aucun paramètre n'est fourni", () => {
      const payload = getPdfExportPayload();

      expect(payload).toEqual({
        typePlacesFinancesStartYear: 2020,
        typePlacesFinancesEndYear: 2024,
        activiteStartMonth: "2024-01",
        activiteEndMonth: "2024-06",
      });
    });

    it("se rabat sur la date actuelle lorsque les tableaux transmis sont vides", () => {
      const payload = getPdfExportPayload({
        typePlacesYears: [],
        financeYears: [],
        activiteDates: [],
      });

      expect(payload).toEqual({
        typePlacesFinancesStartYear: 2020,
        typePlacesFinancesEndYear: 2024,
        activiteStartMonth: "2024-01",
        activiteEndMonth: "2024-06",
      });
    });

    it("utilise la plus récente des années entre typePlacesYears et financeYears", () => {
      const payload = getPdfExportPayload({
        typePlacesYears: [2018, 2019, 2021],
        financeYears: [2019, 2022, 2020],
      });

      expect(payload.typePlacesFinancesEndYear).toBe(2022);
      expect(payload.typePlacesFinancesStartYear).toBe(2018);
    });

    it("calcule correctement l'année si une seule des deux sources d'années est renseignée", () => {
      const payload = getPdfExportPayload({
        typePlacesYears: [2021, 2023],
      });

      expect(payload.typePlacesFinancesEndYear).toBe(2023);
      expect(payload.typePlacesFinancesStartYear).toBe(2019);
    });

    it("détermine correctement les mois d'activité à partir d'un tableau d'objets Date ou strings ISO", () => {
      const payload = getPdfExportPayload({
        activiteDates: ["2023-10-01", "2023-11-01", "2023-12-01"],
      });

      expect(payload.activiteEndMonth).toBe("2023-12");
      expect(payload.activiteStartMonth).toBe("2023-07");
    });

    it("combine correctement les données réelles les plus récentes de l'année et du mois", () => {
      const payload = getPdfExportPayload({
        typePlacesYears: [2020, 2021, 2022],
        financeYears: [2021, 2023],
        activiteDates: [new Date(2024, 2, 1), new Date(2024, 3, 15)],
      });

      expect(payload).toEqual({
        typePlacesFinancesStartYear: 2019,
        typePlacesFinancesEndYear: 2023,
        activiteStartMonth: "2023-11",
        activiteEndMonth: "2024-04",
      });
    });
  });
});
