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

const whereSqlText = (filters: Parameters<typeof buildStructuresWhereSql>[0]) =>
  buildStructuresWhereSql(filters).strings.join(" ");

describe("buildStructuresWhereSql finalised filter", () => {
  it("restricts to structures whose finalisation form is finalised", () => {
    const sql = whereSqlText({
      ...emptyFilters,
      selection: true,
      finalised: true,
    });

    expect(sql).toContain(`fd."slug" = 'finalisation-v1'`);
    expect(sql).toContain(`f."status" = true`);
  });

  it("adds no finalisation condition when finalised is not requested", () => {
    const selectionSql = whereSqlText({ ...emptyFilters, selection: true });
    expect(selectionSql).not.toContain("finalisation-v1");

    const listSql = whereSqlText({ ...emptyFilters, selection: false });
    expect(listSql).not.toContain("finalisation-v1");
    // The non-selection list keeps its "has a Form" filter, unchanged.
    expect(listSql).toContain(`EXISTS (SELECT 1 FROM public."Form" f`);
  });
});
