import { describe, expect, it, vi } from "vitest";

import { computeControleQualiteStatistiques } from "@/app/api/statistiques/controle-qualite/controle-qualite.util";

vi.mock("@/constants", async () => {
  const actual =
    await vi.importActual<typeof import("@/constants")>("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2025,
  };
});

vi.mock("@/app/api/statistiques/shared/shared.utils", async () => {
  const actual = await vi.importActual<
    typeof import("@/app/api/statistiques/shared/shared.utils")
  >("@/app/api/statistiques/shared/shared.utils");
  return {
    ...actual,
    getTwelveMonthCutoffKey: () => "2020-01",
  };
});

describe("quality control statistics util", () => {
  const dnaLinks = [
    { structureId: 1, dna: { code: "DNA01" } },
    { structureId: 2, dna: { code: "DNA02" } },
    { structureId: 3, dna: { code: "DNA03" } },
  ];

  it("aggregates trimester evaluation notes from raw evaluations, not monthly averages", () => {
    const result = computeControleQualiteStatistiques(
      [1],
      100,
      [],
      [
        {
          structureId: 1,
          date: new Date("2025-01-15"),
          note: 2,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        },
        ...Array.from({ length: 10 }, () => ({
          structureId: 1,
          date: new Date("2025-02-15"),
          note: 4,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        })),
      ],
      [],
      "moyenne"
    );

    const trimester2025Q1 = result.byTrimester.find(
      (entry) => entry.year === 2025 && entry.trimester === 1
    );

    // (2 + 10×4) / 11 ≈ 3,8 - pas la moyenne de 2 et 4
    expect(trimester2025Q1?.noteGenerale).toBe(3.8);
    expect(result.byYear[0]?.noteGenerale).toBe(3.8);
  });

  it("computes violent EIG rate from period totals, not the average of monthly rates", () => {
    const result = computeControleQualiteStatistiques(
      [1],
      100,
      [
        {
          dnaCode: "DNA01",
          type: "comportement violent",
          evenementDate: new Date("2025-01-10"),
        },
        {
          dnaCode: "DNA01",
          type: "autre motif",
          evenementDate: new Date("2025-02-10"),
        },
        ...Array.from({ length: 6 }, () => ({
          dnaCode: "DNA01",
          type: "autre motif",
          evenementDate: new Date("2025-02-15"),
        })),
        {
          dnaCode: "DNA01",
          type: "comportement violent",
          evenementDate: new Date("2025-02-20"),
        },
        {
          dnaCode: "DNA01",
          type: "comportement violent",
          evenementDate: new Date("2025-02-25"),
        },
      ],
      [],
      dnaLinks,
      "moyenne"
    );

    const january = result.byMonth.find(
      (entry) => entry.date.toISOString().slice(0, 7) === "2025-01"
    );
    const february = result.byMonth.find(
      (entry) => entry.date.toISOString().slice(0, 7) === "2025-02"
    );
    const trimester = result.byTrimester.find(
      (entry) => entry.year === 2025 && entry.trimester === 1
    );

    expect(january?.tauxEigComportementViolent).toBe(1);
    expect(february?.tauxEigComportementViolent).toBe(0.222);
    // Trimestre : 3 violents / 10 EIG = 0,3 (pas la moyenne de 1 et 0,222)
    expect(trimester?.tauxEigComportementViolent).toBe(0.3);
    expect(trimester?.nbEig).toBe(10);
  });

  it("counts structures without EIG declaration over the full period", () => {
    const result = computeControleQualiteStatistiques(
      [1, 2, 3],
      300,
      [
        {
          dnaCode: "DNA01",
          type: "autre",
          evenementDate: new Date("2025-03-01"),
        },
      ],
      [],
      dnaLinks,
      "moyenne"
    );

    const march = result.byMonth.find(
      (entry) => entry.date.toISOString().slice(0, 7) === "2025-03"
    );

    // 2 structures sur 3 sans déclaration EIG sur le mois
    expect(march?.nbStructuresSansDeclarationEig).toBe(2);
    expect(march?.partStructuresSansDeclarationEig).toBe(0.667);
  });

  it("uses median aggregation for evaluation notes when requested", () => {
    const result = computeControleQualiteStatistiques(
      [1],
      100,
      [],
      [
        {
          structureId: 1,
          date: new Date("2025-06-01"),
          note: 2,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        },
        {
          structureId: 1,
          date: new Date("2025-06-15"),
          note: 4,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        },
        {
          structureId: 1,
          date: new Date("2025-06-20"),
          note: 5,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        },
      ],
      [],
      "mediane"
    );

    expect(result.byMonth[0]?.noteGenerale).toBe(4);
    expect(result.eig.moyenneEvaluationsCurrentYear).toBe(4);
  });
});
