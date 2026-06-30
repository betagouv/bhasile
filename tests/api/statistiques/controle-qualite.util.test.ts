import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeControleQualiteStatistiques } from "@/app/api/statistiques/controle-qualite/controle-qualite-evaluation.util";

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

  it("agrège les notes trimestrielles à partir des évaluations brutes", () => {
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
      "moyenne"
    );

    const trimester2025Q1 = result.byTrimester.find(
      (entry) => entry.year === 2025 && entry.trimester === 1
    );

    // (2 + 10×4) / 11 ≈ 3,8 - pas la moyenne de 2 et 4
    expect(trimester2025Q1?.noteGenerale).toBe(3.8);
    expect(result.byYear[0]?.noteGenerale).toBe(3.8);
  });

  it("calcule le taux d'EIG trimestriel à partir des totaux de la période", () => {
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

  it("compte les structures sans déclaration d'EIG", () => {
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
      "moyenne"
    );

    const march = result.byMonth.find(
      (entry) => entry.date.toISOString().slice(0, 7) === "2025-03"
    );

    // 2 structures sur 3 sans déclaration EIG sur le mois
    expect(march?.nbStructuresSansDeclarationEig).toBe(2);
    expect(march?.partStructuresSansDeclarationEig).toBe(0.667);
  });

  it("utilise l'agrégation médiane pour les notes d'évaluation", () => {
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
      "mediane"
    );

    expect(result.byMonth[0]?.noteGenerale).toBe(4);
    expect(result.eig.moyenneEvaluationsCurrentYear).toBe(4);
  });
});
