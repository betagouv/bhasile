import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeControleQualiteStatistiques } from "@/app/api/statistiques/controle-qualite/controle-qualite-evaluation.util";

import { buildTestActivityContext } from "./test-helpers";

vi.mock("@/constants", async () => {
  const actual =
    await vi.importActual<typeof import("@/constants")>("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2025,
  };
});

describe("quality control statistics util", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  const dnaLinks = [
    { id: 1, structureId: 1, dna: { code: "DNA01" } },
    { id: 2, structureId: 2, dna: { code: "DNA02" } },
    { id: 3, structureId: 3, dna: { code: "DNA03" } },
  ];

  it("should aggregate trimester notes from raw evaluations", () => {
    const result = computeControleQualiteStatistiques(
      [1],
      100,
      [],
      [
        {
          id: 1,
          structureId: 1,
          date: new Date("2025-01-15"),
          note: 2,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        },
        ...Array.from({ length: 10 }, (_, index) => ({
          id: index + 2,
          structureId: 1,
          date: new Date("2025-02-15"),
          note: 4,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        })),
      ],
      [],
      "moyenne",
      buildTestActivityContext([1])
    );

    const trimester2025Q1 = result.byTrimester.find(
      (entry) => entry.year === 2025 && entry.trimester === 1
    );

    // (2 + 10×4) / 11 ≈ 3,8 - pas la moyenne de 2 et 4
    expect(trimester2025Q1?.noteGenerale).toBe(3.8);
    expect(result.byYear[0]?.noteGenerale).toBe(3.8);
  });

  it("should compute trimester EIG rate from period totals", () => {
    const result = computeControleQualiteStatistiques(
      [1],
      100,
      [
        {
          id: 1,
          dnaCode: "DNA01",
          type: "comportement violent",
          evenementDate: new Date("2025-01-10"),
        },
        {
          id: 2,
          dnaCode: "DNA01",
          type: "autre motif",
          evenementDate: new Date("2025-02-10"),
        },
        ...Array.from({ length: 6 }, (_, index) => ({
          id: index + 3,
          dnaCode: "DNA01",
          type: "autre motif",
          evenementDate: new Date("2025-02-15"),
        })),
        {
          id: 9,
          dnaCode: "DNA01",
          type: "comportement violent",
          evenementDate: new Date("2025-02-20"),
        },
        {
          id: 10,
          dnaCode: "DNA01",
          type: "comportement violent",
          evenementDate: new Date("2025-02-25"),
        },
      ],
      [],
      dnaLinks,
      "moyenne",
      buildTestActivityContext([1])
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

  it("should count structures without EIG declaration", () => {
    const result = computeControleQualiteStatistiques(
      [1, 2, 3],
      300,
      [
        {
          id: 1,
          dnaCode: "DNA01",
          type: "autre",
          evenementDate: new Date("2025-03-01"),
        },
      ],
      [],
      dnaLinks,
      "moyenne",
      buildTestActivityContext([1, 2, 3])
    );

    const march = result.byMonth.find(
      (entry) => entry.date.toISOString().slice(0, 7) === "2025-03"
    );

    // 2 structures sur 3 sans déclaration EIG sur le mois
    expect(march?.nbStructuresSansDeclarationEig).toBe(2);
    expect(march?.partStructuresSansDeclarationEig).toBe(0.667);
  });

  it("should use period-specific structure perimeter for month and trimester", () => {
    const activityContext = buildTestActivityContext([1, 2, 3], {
      closureDates: new Map([
        [1, null],
        [2, null],
        [3, new Date("2025-02-01T00:00:00.000Z")],
      ]),
    });

    const result = computeControleQualiteStatistiques(
      [1, 2, 3],
      300,
      [
        {
          id: 1,
          dnaCode: "DNA01",
          type: "autre",
          evenementDate: new Date("2025-03-01"),
        },
      ],
      [
        {
          id: 1,
          structureId: 1,
          date: new Date("2025-02-15"),
          note: 3,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        },
      ],
      dnaLinks,
      "moyenne",
      activityContext
    );

    const february = result.byMonth.find(
      (entry) => entry.date.toISOString().slice(0, 7) === "2025-02"
    );
    const march = result.byMonth.find(
      (entry) => entry.date.toISOString().slice(0, 7) === "2025-03"
    );
    const trimesterQ1 = result.byTrimester.find(
      (entry) => entry.year === 2025 && entry.trimester === 1
    );

    // Février : structure 3 encore active au moins un jour (évaluation force la série)
    expect(february?.nbStructuresSansDeclarationEig).toBe(3);
    // Mars : structure 3 fermée avant le mois
    expect(march?.nbStructuresSansDeclarationEig).toBe(1);
    expect(march?.partStructuresSansDeclarationEig).toBe(0.5);
    // Trimestre Q1 2025 : union des structures actives sur jan–mar
    expect(trimesterQ1?.nbStructuresSansDeclarationEig).toBe(2);
  });

  it("should use median aggregation for evaluation notes", () => {
    const result = computeControleQualiteStatistiques(
      [1],
      100,
      [],
      [
        {
          id: 1,
          structureId: 1,
          date: new Date("2025-06-01"),
          note: 2,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        },
        {
          id: 2,
          structureId: 1,
          date: new Date("2025-06-15"),
          note: 4,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        },
        {
          id: 3,
          structureId: 1,
          date: new Date("2025-06-20"),
          note: 5,
          notePersonne: null,
          notePro: null,
          noteStructure: null,
        },
      ],
      [],
      "mediane",
      buildTestActivityContext([1])
    );

    expect(result.byMonth[0]?.noteGenerale).toBe(4);
    expect(result.eig.moyenneEvaluationsCurrentYear).toBe(4);
  });
});
