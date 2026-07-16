import { describe, expect, it } from "vitest";

import {
  getIndicateursFinanciersDefaultValues,
  isYearPrevisionnelle,
  isYearRealisee,
} from "@/app/utils/indicateurFinancier.util";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";

const rempli = (
  year: number,
  type: "REALISE" | "PREVISIONNEL"
): IndicateurFinancierApiType =>
  ({
    year,
    type,
    ETP: 1,
    tauxEncadrement: 1,
    coutJournalier: 1,
  }) as IndicateurFinancierApiType;

describe("getIndicateursFinanciersDefaultValues", () => {
  it("crée réalisé + prévisionnel pour une année >= 2024", () => {
    const result = getIndicateursFinanciersDefaultValues([], 2024);
    const pour2024 = result.filter(
      (indicateurFinancier) => indicateurFinancier.year === 2024
    );

    expect(
      pour2024.map((indicateurFinancier) => indicateurFinancier.type).sort()
    ).toEqual(["PREVISIONNEL", "REALISE"]);
  });

  it("crée seulement le réalisé pour une année < 2024", () => {
    const result = getIndicateursFinanciersDefaultValues([], 2023);
    const pour2023 = result.filter(
      (indicateurFinancier) => indicateurFinancier.year === 2023
    );

    expect(
      pour2023.map((indicateurFinancier) => indicateurFinancier.type)
    ).toEqual(["REALISE"]);
  });

  it("réinjecte les valeurs persistées", () => {
    const existant = { ...rempli(2024, "REALISE"), ETP: 42 };

    const result = getIndicateursFinanciersDefaultValues([existant], 2024);
    const realise2024 = result.find(
      (indicateurFinancier) =>
        indicateurFinancier.year === 2024 &&
        indicateurFinancier.type === "REALISE"
    );

    expect(realise2024?.ETP).toBe(42);
  });
});

describe("isYearRealisee / isYearPrevisionnelle", () => {
  it("détecte un réalisé complet", () => {
    expect(isYearRealisee([rempli(2024, "REALISE")], 2024)).toBe(true);
  });

  it("rejette un réalisé incomplet", () => {
    const partiel = {
      ...rempli(2024, "REALISE"),
      coutJournalier: null,
    } as IndicateurFinancierApiType;

    expect(isYearRealisee([partiel], 2024)).toBe(false);
  });

  it("rejette quand aucun réalisé n'existe pour l'année", () => {
    expect(isYearRealisee([rempli(2024, "PREVISIONNEL")], 2024)).toBe(false);
  });

  it("détecte un prévisionnel complet", () => {
    expect(isYearPrevisionnelle([rempli(2024, "PREVISIONNEL")], 2024)).toBe(
      true
    );
  });
});
