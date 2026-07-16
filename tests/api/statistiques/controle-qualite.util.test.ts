import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  computeControleQualiteByYear,
  computeControleQualiteStatistiques,
} from "@/app/api/statistiques/controle-qualite/controle-qualite.util";
import type { StatistiquesContext } from "@/app/api/statistiques/statistiques.db.type";
import { StructureType } from "@/types/structure.type";

import {
  buildTestActiveStructureIdsByPeriod,
  buildTestDnaLinks,
  buildTestStatistiquesContext,
} from "./test-helpers";

const NOW = new Date("2026-01-15T00:00:00.000Z");

const testStructure = (id: number) => ({
  id,
  type: StructureType.CADA,
  departementAdministratif: "01",
});

const testTypologie = (structureId: number, placesAutorisees = 100) => ({
  id: structureId,
  structureId,
  year: 2025,
  placesAutorisees,
  pmr: 0,
  lgbt: 0,
  fvvTeh: 0,
});

const dnaLinks = buildTestDnaLinks([
  { structureId: 1, dnaCode: "DNA01" },
  { structureId: 2, dnaCode: "DNA02" },
  { structureId: 3, dnaCode: "DNA03" },
]);

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
    structures: structureIds.map(testStructure),
    allStructures: structureIds.map(testStructure),
    typologies: structureIds.map((id) => testTypologie(id)),
    adresses: [],
    departements: [],
    dnaLinks: partial.dnaLinks ?? dnaLinks,
    eigs: partial.eigs ?? [],
    evaluations: partial.evaluations ?? [],
    activeStructureIdsByPeriod:
      partial.activeStructureIdsByPeriod ??
      buildTestActiveStructureIdsByPeriod(structureIds),
  });

describe("contrôle qualité - agrégats de référence (12 derniers mois)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("filtre les EIG de référence sur une fenêtre glissante de 12 mois", () => {
    const result = computeControleQualiteStatistiques(
      buildControleQualiteContext([1], {
        eigs: [
          {
            id: 1,
            dnaCode: "DNA01",
            type: "autre motif",
            evenementDate: new Date("2024-12-10T00:00:00.000Z"),
          },
          {
            id: 2,
            dnaCode: "DNA01",
            type: "comportement violent",
            evenementDate: new Date("2025-01-10T00:00:00.000Z"),
          },
          {
            id: 3,
            dnaCode: "DNA01",
            type: "autre motif",
            evenementDate: new Date("2026-01-10T00:00:00.000Z"),
          },
        ],
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod([1], {
          periodDates: [
            new Date("2024-12-10T00:00:00.000Z"),
            new Date("2025-01-10T00:00:00.000Z"),
            new Date("2026-01-10T00:00:00.000Z"),
          ],
        }),
      }),
      "moyenne"
    );

    expect(result.eig.nbEig).toBe(2);
    expect(result.eig.nbEigComportementViolent).toBe(1);
    expect(result.eig.tauxEig).toBe(0.02);
    expect(result.eig.tauxEigComportementViolent).toBe(0.5);
  });
});

describe("contrôle qualité - regroupements mois / trimestre / année", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("regroupe les EIG par mois, puis consolide sur trimestre et année", () => {
    const result = computeControleQualiteStatistiques(
      buildControleQualiteContext([1], {
        eigs: [
          {
            id: 1,
            dnaCode: "DNA01",
            type: "autre motif",
            evenementDate: new Date("2025-01-10T00:00:00.000Z"),
          },
          {
            id: 2,
            dnaCode: "DNA01",
            type: "autre motif",
            evenementDate: new Date("2025-02-10T00:00:00.000Z"),
          },
          {
            id: 3,
            dnaCode: "DNA01",
            type: "comportement violent",
            evenementDate: new Date("2025-02-20T00:00:00.000Z"),
          },
          {
            id: 4,
            dnaCode: "DNA01",
            type: "comportement violent",
            evenementDate: new Date("2025-07-20T00:00:00.000Z"),
          },
        ],
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod([1], {
          periodDates: [
            new Date("2025-01-10T00:00:00.000Z"),
            new Date("2025-02-10T00:00:00.000Z"),
            new Date("2025-02-20T00:00:00.000Z"),
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
    const trimester2025Q1 = result.byTrimester.find(
      (entry) => entry.date.toISOString().slice(0, 10) === "2025-01-01"
    );
    const year2025 = result.byYear.find(
      (entry) => entry.date.toISOString().slice(0, 4) === "2025"
    );

    expect(january?.nbEig).toBe(1);
    expect(february?.nbEig).toBe(2);
    expect(trimester2025Q1?.nbEig).toBe(3);
    expect(year2025?.nbEig).toBe(4);
  });

  it("ne compte que les EIG résolvant vers une structure active en scope (pas le total du périmètre)", () => {
    const result = computeControleQualiteByYear(
      buildControleQualiteContext([1, 2], {
        eigs: [
          {
            id: 1,
            dnaCode: "DNA01", // structure 1 : en scope
            type: "autre motif",
            evenementDate: new Date("2025-03-10T00:00:00.000Z"),
          },
          {
            id: 2,
            dnaCode: "DNA02", // structure 2 : hors scope
            type: "autre motif",
            evenementDate: new Date("2025-03-10T00:00:00.000Z"),
          },
        ],
        // seule la structure 1 est active dans le périmètre découpé
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod([1], {
          periodDates: [new Date("2025-03-10T00:00:00.000Z")],
        }),
      }),
      "moyenne"
    );

    const year2025 = result.find(
      (entry) => entry.date.toISOString().slice(0, 4) === "2025"
    );

    // Avant le fix : 2 (les deux EIG du périmètre). Après : 1 (DNA02 exclu).
    expect(year2025?.nbEig).toBe(1);
  });
});

describe("contrôle qualité - structures actives sans déclaration EIG", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("compte les structures actives sur la période ne déclarant aucun EIG", () => {
    const result = computeControleQualiteStatistiques(
      buildControleQualiteContext([1, 2, 3], {
        eigs: [
          {
            id: 1,
            dnaCode: "DNA01",
            type: "autre motif",
            evenementDate: new Date("2025-03-01T00:00:00.000Z"),
          },
        ],
        activeStructureIdsByPeriod: buildTestActiveStructureIdsByPeriod(
          [1, 2, 3],
          { periodDates: [new Date("2025-03-01T00:00:00.000Z")] }
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
});
