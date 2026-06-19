import { describe, expect, it, vi } from "vitest";

import { computeStructuresStatistiques } from "@/app/api/statistiques/structures/structures.util";
import { Repartition, StructureType } from "@/generated/prisma/client";

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
  it("counts type and bati breakdown only for structures with typologie", () => {
    const result = computeStructuresStatistiques(
      [
        { id: 1, type: StructureType.CADA, departementAdministratif: "75" },
        { id: 2, type: StructureType.CPH, departementAdministratif: "75" },
      ],
      [
        {
          structureId: 1,
          year: 2024,
          placesAutorisees: 100,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
        },
      ],
      [
        {
          id: 10,
          structureId: 1,
          repartition: Repartition.COLLECTIF,
          qpv: 0,
          logementSocial: 0,
        },
        {
          id: 11,
          structureId: 2,
          repartition: Repartition.DIFFUS,
          qpv: 0,
          logementSocial: 0,
        },
      ],
      []
    );

    expect(result.totalStructures).toBe(2);
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

  it("counts active CPOMs for the current year only", () => {
    const result = computeStructuresStatistiques(
      [{ id: 1, type: StructureType.CADA, departementAdministratif: "75" }],
      [
        {
          structureId: 1,
          year: 2025,
          placesAutorisees: 50,
          pmr: 0,
          lgbt: 0,
          fvvTeh: 0,
        },
      ],
      [],
      [
        {
          cpomId: 100,
          structureId: 1,
          dateStart: new Date("2024-01-01"),
          dateEnd: new Date("2025-12-31"),
        },
        {
          cpomId: 101,
          structureId: 1,
          dateStart: new Date("2020-01-01"),
          dateEnd: new Date("2023-12-31"),
        },
      ]
    );

    expect(result.totalCpoms).toBe(1);
    expect(result.structuresAvecCpom).toBe(1);
  });
});
