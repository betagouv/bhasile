import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeControleQualiteStatistiques } from "@/app/api/statistiques/controle-qualite/controle-qualite.util";
import type { StatistiquesContext } from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActiveStructureIdsByPeriod,
  buildTestDnaLinks,
  buildTestStatistiquesContext,
} from "./test-helpers";

describe("quality control statistics util", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const dnaLinks = buildTestDnaLinks([
    { structureId: 1, dnaCode: "DNA01" },
    { structureId: 2, dnaCode: "DNA02" },
    { structureId: 3, dnaCode: "DNA03" },
  ]);

  const structure = (id: number) => ({
    id,
    type: StructureType.CADA,
    departementAdministratif: "01",
  });

  const typologie = (structureId: number, placesAutorisees = 100) => ({
    id: structureId,
    structureId,
    year: 2025,
    placesAutorisees,
    pmr: 0,
    lgbt: 0,
    fvvTeh: 0,
  });

  const buildControleQualiteContext = (
    structureIds: number[],
    partial: Partial<
      Pick<
        StatistiquesContext,
        "eigs" | "evaluations" | "activeStructureIdsByPeriod" | "dnaLinks"
      >
    > = {}
  ) =>
    buildTestStatistiquesContext({
      structures: structureIds.map(structure),
      allStructures: structureIds.map(structure),
      typologies: structureIds.map((id) => typologie(id)),
      adresses: [],
      departements: [],
      dnaLinks: partial.dnaLinks ?? dnaLinks,
      eigs: partial.eigs ?? [],
      evaluations: partial.evaluations ?? [],
      activeStructureIdsByPeriod:
        partial.activeStructureIdsByPeriod ??
        buildTestActiveStructureIdsByPeriod(structureIds),
    });

  it("should aggregate trimester notes from raw evaluations", () => {
    const result = computeControleQualiteStatistiques(
      buildControleQualiteContext([1], {
        evaluations: [
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
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod([1], {
          periodDates: [new Date("2025-01-15"), new Date("2025-02-15")],
        }),
      }),
      "moyenne"
    );

    const trimester2025Q1 = result.byTrimester.find(
      (entry) => entry.year === 2025 && entry.trimester === 1
    );

    expect(trimester2025Q1?.noteGenerale).toBe(3.8);
    expect(result.byYear[0]?.noteGenerale).toBe(3.8);
  });

  it("should compute trimester EIG rate from period totals", () => {
    const result = computeControleQualiteStatistiques(
      buildControleQualiteContext([1], {
        eigs: [
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
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod([1], {
          periodDates: [
            new Date("2025-01-10"),
            new Date("2025-02-10"),
            new Date("2025-02-15"),
            new Date("2025-02-20"),
            new Date("2025-02-25"),
          ],
        }),
      }),
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
    expect(trimester?.tauxEigComportementViolent).toBe(0.3);
    expect(trimester?.nbEig).toBe(10);
  });

  it("should count structures without EIG declaration", () => {
    const result = computeControleQualiteStatistiques(
      buildControleQualiteContext([1, 2, 3], {
        eigs: [
          {
            id: 1,
            dnaCode: "DNA01",
            type: "autre",
            evenementDate: new Date("2025-03-01"),
          },
        ],
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod(
          [1, 2, 3],
          { periodDates: [new Date("2025-03-01")] }
        ),
      }),
      "moyenne"
    );

    const march = result.byMonth.find(
      (entry) => entry.date.toISOString().slice(0, 7) === "2025-03"
    );

    expect(march?.nbStructuresSansDeclarationEig).toBe(2);
    expect(march?.partStructuresSansDeclarationEig).toBe(0.667);
  });

  it("should use period-specific structure perimeter for month and trimester", () => {
    const result = computeControleQualiteStatistiques(
      buildControleQualiteContext([1, 2, 3], {
        eigs: [
          {
            id: 1,
            dnaCode: "DNA01",
            type: "autre",
            evenementDate: new Date("2025-03-01"),
          },
        ],
        evaluations: [
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
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod(
          [1, 2, 3],
          {
            closureDates: new Map([
              [1, null],
              [2, null],
              [3, new Date("2025-02-01T00:00:00.000Z")],
            ]),
            periodDates: [new Date("2025-02-15"), new Date("2025-03-01")],
          }
        ),
      }),
      "moyenne"
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

    expect(february?.nbStructuresSansDeclarationEig).toBe(3);
    expect(march?.nbStructuresSansDeclarationEig).toBe(1);
    expect(march?.partStructuresSansDeclarationEig).toBe(0.5);
    expect(trimesterQ1?.nbStructuresSansDeclarationEig).toBe(2);
  });

  it("should use median aggregation for evaluation notes", () => {
    const result = computeControleQualiteStatistiques(
      buildControleQualiteContext([1], {
        evaluations: [
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
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod([1], {
          periodDates: [
            new Date("2025-06-01"),
            new Date("2025-06-15"),
            new Date("2025-06-20"),
          ],
        }),
      }),
      "mediane"
    );

    expect(result.byMonth[0]?.noteGenerale).toBe(4);
    expect(result.eig.moyenneEvaluationsCurrentYear).toBe(4);
  });
});
