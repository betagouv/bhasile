import { afterEach, describe, expect, it, vi } from "vitest";

import { StructureDbList } from "@/app/api/structures/structure.db.type";
import { buildStructuresWhereSql } from "@/app/api/structures/structure.sql";
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
        id: 201,
        category: "CONVENTION",
        startDate: new Date("2025-01-01T00:00:00.000Z"),
        endDate: new Date("2026-02-01T00:00:00.000Z"),
      },
      {
        id: 202,
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

const emptyFilters = {
  search: null,
  type: null,
  bati: null,
  placesAutorisees: null,
  departements: null,
  operateurs: null,
};

const buildWhere = (filters: Parameters<typeof buildStructuresWhereSql>[0]) =>
  buildStructuresWhereSql(filters, new Date());

describe("buildStructuresWhereSql finalised filter", () => {
  it("restricts to structures whose finalisation form is finalised", () => {
    const where = buildWhere({
      ...emptyFilters,
      selection: true,
      finalised: true,
    });

    expect(where.strings.join(" ")).toContain(`fd."slug" =`);
    expect(where.strings.join(" ")).toContain(`f."status" = true`);
    // The slug is passed as a bound parameter, never inlined into the SQL text.
    expect(where.values).toContain("finalisation-v1");
  });

  it("adds no finalisation condition when finalised is not requested", () => {
    // The slug is now a bound value, so it never appears in the raw SQL text:
    // assert over `values` to actually detect a stray finalised clause.
    const selection = buildWhere({ ...emptyFilters, selection: true });
    expect(selection.values).not.toContain("finalisation-v1");

    const list = buildWhere({ ...emptyFilters, selection: false });
    expect(list.values).not.toContain("finalisation-v1");
    // The non-selection list keeps its "has a Form" filter, unchanged.
    expect(list.strings.join(" ")).toContain(
      `EXISTS (SELECT 1 FROM public."Form" f`
    );
  });
});
