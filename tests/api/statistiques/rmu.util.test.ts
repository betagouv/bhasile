import { describe, expect, it } from "vitest";

import { computeRmuStatistiques } from "@/app/api/statistiques/rmu/rmu.util";
import type { StatistiqueDbRmu } from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

import { buildTestStatistiquesContext } from "./test-helpers";

const rmuRow = (
  partial: Partial<StatistiqueDbRmu> &
    Pick<StatistiqueDbRmu, "id" | "departementNumero" | "date">
): StatistiqueDbRmu => ({
  referesEngages: null,
  referesExecutes: null,
  ...partial,
});

const contextWithRmus = (rmus: StatistiqueDbRmu[]) =>
  buildTestStatistiquesContext({
    structures: [{ id: 1, type: StructureType.CADA, departementAdministratif: "75" }],
    typologies: [],
    adresses: [],
    departements: [],
    rmus,
  });

describe("rmu - séries mensuelle, trimestrielle et annuelle", () => {
  it("somme les référés de tous les départements du périmètre par période", () => {
    const result = computeRmuStatistiques(
      contextWithRmus([
        rmuRow({
          id: 1,
          departementNumero: "75",
          date: new Date("2025-01-01T13:00:00.000Z"),
          referesEngages: 10,
          referesExecutes: 5,
        }),
        rmuRow({
          id: 2,
          departementNumero: "92",
          date: new Date("2025-01-01T13:00:00.000Z"),
          referesEngages: 30,
          referesExecutes: 15,
        }),
      ])
    );

    expect(result?.byMonth).toHaveLength(1);
    expect(result?.byMonth[0]).toMatchObject({
      referesEngages: 40,
      referesExecutes: 20,
      tauxExecute: 0.5,
    });
    expect(result?.byMonth[0]?.date.toISOString().slice(0, 7)).toBe("2025-01");
  });

  it("recalcule le taux exécuté par trimestre sur les totaux (pas une moyenne de taux mensuels)", () => {
    const result = computeRmuStatistiques(
      contextWithRmus([
        rmuRow({
          id: 1,
          departementNumero: "75",
          date: new Date("2025-01-01T13:00:00.000Z"),
          referesEngages: 100,
          referesExecutes: 100,
        }),
        rmuRow({
          id: 2,
          departementNumero: "75",
          date: new Date("2025-02-01T13:00:00.000Z"),
          referesEngages: 100,
          referesExecutes: 0,
        }),
      ])
    );

    const trimester = result?.byTrimester.find(
      (entry) => entry.date.toISOString().slice(0, 7) === "2025-01"
    );
    // 100/200 = 0,5, et non (1 + 0) / 2 par mois.
    expect(trimester).toMatchObject({
      referesEngages: 200,
      referesExecutes: 100,
      tauxExecute: 0.5,
    });

    const year = result?.byYear.find(
      (entry) => entry.date.toISOString().slice(0, 4) === "2025"
    );
    expect(year).toMatchObject({ referesEngages: 200, tauxExecute: 0.5 });
  });

  it("n'infère aucune période sans déclaration et rend un taux null quand aucun référé n'est engagé", () => {
    const result = computeRmuStatistiques(
      contextWithRmus([
        rmuRow({
          id: 1,
          departementNumero: "75",
          date: new Date("2025-03-01T13:00:00.000Z"),
          referesEngages: 0,
          referesExecutes: 0,
        }),
      ])
    );

    expect(result?.byMonth).toHaveLength(1);
    expect(result?.byMonth[0]?.tauxExecute).toBeNull();
    // Février n'a aucune ligne : il n'apparaît pas.
    expect(
      result?.byMonth.some(
        (entry) => entry.date.toISOString().slice(0, 7) === "2025-02"
      )
    ).toBe(false);
  });

  it("traite les champs null comme zéro dans les sommes", () => {
    const result = computeRmuStatistiques(
      contextWithRmus([
        rmuRow({
          id: 1,
          departementNumero: "75",
          date: new Date("2025-04-01T13:00:00.000Z"),
          referesEngages: 8,
          referesExecutes: null,
        }),
      ])
    );

    expect(result?.byMonth[0]).toMatchObject({
      referesEngages: 8,
      referesExecutes: 0,
      tauxExecute: 0,
    });
  });

  it("rend des séries vides quand le périmètre n'a aucun RMU", () => {
    const result = computeRmuStatistiques(contextWithRmus([]));

    expect(result).not.toBeNull();
    expect(result?.byMonth).toEqual([]);
    expect(result?.byTrimester).toEqual([]);
    expect(result?.byYear).toEqual([]);
  });

  it("retourne null quand le RMU est non applicable (filtre opérateur/type)", () => {
    const context = buildTestStatistiquesContext({
      structures: [
        { id: 1, type: StructureType.CADA, departementAdministratif: "75" },
      ],
      typologies: [],
      adresses: [],
      departements: [],
      rmus: null,
    });

    expect(computeRmuStatistiques(context)).toBeNull();
  });
});
