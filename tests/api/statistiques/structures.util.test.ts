import { describe, expect, it, vi } from "vitest";

import { computeStructuresStatistiques } from "@/app/api/statistiques/structures/structures.util";
import { Repartition } from "@/types/adresse.type";
import { StructureType } from "@/types/structure.type";

import { buildTestStatistiquesContext } from "./test-helpers";

vi.mock("@/constants", async () => {
  const actual = await vi.importActual<typeof import("@/constants")>(
    "@/constants"
  );
  return {
    ...actual,
    CURRENT_YEAR: 2025,
  };
});

describe("structures statistics util", () => {
  it("should count type and bati only with typologie", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [
          { id: 1, type: StructureType.CADA, departementAdministratif: "75" },
          { id: 2, type: StructureType.CPH, departementAdministratif: "75" },
        ],
        typologies: [
          {
            id: 1,
            structureId: 1,
            year: 2024,
            placesAutorisees: 100,
            pmr: 0,
            lgbt: 0,
            fvvTeh: 0,
          },
        ],
        adresses: [
          {
            id: 10,
            structureId: 1,
            repartition: Repartition.COLLECTIF,
            placesAutorisees: 100,
            qpv: 0,
            logementSocial: 0,
          },
          {
            id: 11,
            structureId: 2,
            repartition: Repartition.DIFFUS,
            placesAutorisees: 0,
            qpv: 0,
            logementSocial: 0,
          },
        ],
        departements: [],
      })
    );

    expect(result.totalStructures).toBe(2);
    expect(result.structureTypes).not.toContainEqual(
      expect.objectContaining({ type: StructureType.PRAHDA })
    );
    expect(result.structureTypes).toContainEqual({
      type: StructureType.CADA,
      structures: 1,
      places: 100,
    });
    expect(result.structureTypes).toContainEqual({
      type: StructureType.CPH,
      structures: 0,
      places: 0,
    });
    expect(result.structureBatis).toContainEqual({
      bati: Repartition.COLLECTIF,
      structures: 1,
      places: 100,
    });
    expect(result.structureBatis).toContainEqual({
      bati: Repartition.DIFFUS,
      structures: 0,
      places: 0,
    });
  });

  it("should split bati places by address repartition", () => {
    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [
          { id: 1, type: StructureType.CADA, departementAdministratif: "75" },
        ],
        typologies: [
          {
            id: 1,
            structureId: 1,
            year: 2024,
            placesAutorisees: 100,
            pmr: 0,
            lgbt: 0,
            fvvTeh: 0,
          },
        ],
        adresses: [
          {
            id: 10,
            structureId: 1,
            repartition: Repartition.COLLECTIF,
            placesAutorisees: 60,
            qpv: 0,
            logementSocial: 0,
          },
          {
            id: 11,
            structureId: 1,
            repartition: Repartition.DIFFUS,
            placesAutorisees: 40,
            qpv: 0,
            logementSocial: 0,
          },
        ],
        departements: [],
      })
    );

    expect(result.structureBatis).toContainEqual({
      bati: Repartition.MIXTE,
      structures: 1,
      places: 0,
    });
    expect(result.structureBatis).toContainEqual({
      bati: Repartition.COLLECTIF,
      structures: 0,
      places: 60,
    });
    expect(result.structureBatis).toContainEqual({
      bati: Repartition.DIFFUS,
      structures: 0,
      places: 40,
    });
  });

  it("should count active CPOMs for current year only", () => {
    vi.setSystemTime(new Date("2025-06-15T12:00:00.000Z"));

    const result = computeStructuresStatistiques(
      buildTestStatistiquesContext({
        structures: [
          { id: 1, type: StructureType.CADA, departementAdministratif: "75" },
        ],
        typologies: [
          {
            id: 1,
            structureId: 1,
            year: 2025,
            placesAutorisees: 50,
            pmr: 0,
            lgbt: 0,
            fvvTeh: 0,
          },
        ],
        adresses: [],
        cpomLinks: [
          {
            id: 1,
            cpomId: 100,
            structureId: 1,
            dateStart: new Date("2024-01-01"),
            dateEnd: new Date("2025-12-31"),
            cpom: { actesAdministratifs: [] },
          },
          {
            id: 2,
            cpomId: 101,
            structureId: 1,
            dateStart: new Date("2020-01-01"),
            dateEnd: new Date("2023-12-31"),
            cpom: { actesAdministratifs: [] },
          },
        ],
        departements: [],
      })
    );

    expect(result.totalCpoms).toBe(1);
    expect(result.structuresAvecCpom).toBe(1);

    vi.useRealTimers();
  });
});
