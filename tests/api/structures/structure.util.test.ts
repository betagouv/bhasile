import { afterEach, describe, expect, it, vi } from "vitest";

import { StructureDbList } from "@/app/api/structures/structure.db.type";
import {
  getDatesConvention,
  getDatesPeriodeAutorisation,
} from "@/app/api/structures/structure.util";

type ActeAdministratifStub = {
  id?: number;
  parentId?: number | null;
  category?: "CONVENTION" | "ARRETE_AUTORISATION" | "AUTRE";
  startDate?: Date | null;
  endDate?: Date | null;
};

const createStructure = (
  actesAdministratifs: ActeAdministratifStub[]
): StructureDbList =>
  ({
    actesAdministratifs,
  }) as unknown as StructureDbList;

describe("structure dates from actes administratifs", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns convention and autorisation dates through dedicated wrappers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
    const structure = createStructure([
      {
        category: "CONVENTION",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        category: "ARRETE_AUTORISATION",
        startDate: new Date("2024-01-01T00:00:00.000Z"),
        endDate: new Date("2027-01-01T00:00:00.000Z"),
      },
    ]);

    expect(getDatesConvention(structure)).toEqual([
      new Date("2025-01-01T00:00:00.000Z"),
      new Date("2026-02-01T00:00:00.000Z"),
    ]);
    expect(getDatesPeriodeAutorisation(structure)).toEqual([
      new Date("2024-01-01T00:00:00.000Z"),
      new Date("2027-01-01T00:00:00.000Z"),
    ]);
  });
});
