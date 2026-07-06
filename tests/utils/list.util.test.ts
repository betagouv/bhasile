import { describe, expect, it } from "vitest";

import {
  compareSortValues,
  paginateRows,
  sortRows,
} from "@/app/utils/list.util";
import { DEFAULT_PAGE_SIZE } from "@/constants";

describe("compareSortValues", () => {
  it("orders text with French collation", () => {
    expect(compareSortValues("a", "b", "asc", "text")).toBeLessThan(0);
    expect(compareSortValues("b", "a", "asc", "text")).toBeGreaterThan(0);
    expect(compareSortValues("a", "a", "asc", "text")).toBe(0);
  });

  it("orders numbers numerically, not lexically", () => {
    expect(compareSortValues(2, 10, "asc", "number")).toBeLessThan(0);
    expect(compareSortValues(10, 2, "asc", "number")).toBeGreaterThan(0);
  });

  it("inverts comparison for desc", () => {
    expect(compareSortValues("a", "b", "desc", "text")).toBeGreaterThan(0);
    expect(compareSortValues(2, 10, "desc", "number")).toBeGreaterThan(0);
  });

  it("puts nulls last in asc, first in desc", () => {
    expect(compareSortValues(null, 1, "asc", "number")).toBeGreaterThan(0);
    expect(compareSortValues(1, null, "asc", "number")).toBeLessThan(0);
    expect(compareSortValues(null, 1, "desc", "number")).toBeLessThan(0);
    expect(compareSortValues(1, null, "desc", "number")).toBeGreaterThan(0);
  });

  it("treats two nulls as equal in both directions", () => {
    expect(compareSortValues(null, null, "asc", "number")).toBe(0);
    expect(compareSortValues(null, null, "desc", "number")).toBe(0);
  });
});

type Row = { name: string | null; id: number };

const sortByNameTieId = (rows: Row[], direction: "asc" | "desc"): Row[] =>
  sortRows(
    rows,
    (row) => ({ value: row.name, kind: "text" }),
    (row) => ({ value: row.id, kind: "number" }),
    direction
  );

describe("sortRows", () => {
  it("sorts by primary accessor", () => {
    const rows: Row[] = [
      { name: "b", id: 1 },
      { name: "a", id: 2 },
      { name: "c", id: 3 },
    ];
    expect(sortByNameTieId(rows, "asc").map((row) => row.name)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("breaks ties with the tie-break accessor numerically", () => {
    const rows: Row[] = [
      { name: "a", id: 10 },
      { name: "a", id: 2 },
    ];
    expect(sortByNameTieId(rows, "asc").map((row) => row.id)).toEqual([2, 10]);
  });

  it("keeps tie-break ascending even when primary is desc", () => {
    const rows: Row[] = [
      { name: "a", id: 10 },
      { name: "a", id: 2 },
    ];
    expect(sortByNameTieId(rows, "desc").map((row) => row.id)).toEqual([2, 10]);
  });

  it("sorts null primary values last in asc", () => {
    const rows: Row[] = [
      { name: null, id: 1 },
      { name: "a", id: 2 },
    ];
    expect(sortByNameTieId(rows, "asc").map((row) => row.name)).toEqual([
      "a",
      null,
    ]);
  });

  it("does not mutate the input array", () => {
    const rows: Row[] = [
      { name: "b", id: 1 },
      { name: "a", id: 2 },
    ];
    sortByNameTieId(rows, "asc");
    expect(rows.map((row) => row.name)).toEqual(["b", "a"]);
  });
});

describe("paginateRows", () => {
  const rows = Array.from({ length: DEFAULT_PAGE_SIZE * 2 + 5 }, (_, index) => index);

  it("returns the first page", () => {
    const page = paginateRows(rows, 0);
    expect(page).toHaveLength(DEFAULT_PAGE_SIZE);
    expect(page[0]).toBe(0);
  });

  it("returns the next page offset by page size", () => {
    const page = paginateRows(rows, 1);
    expect(page[0]).toBe(DEFAULT_PAGE_SIZE);
    expect(page).toHaveLength(DEFAULT_PAGE_SIZE);
  });

  it("returns the partial last page", () => {
    expect(paginateRows(rows, 2)).toHaveLength(5);
  });

  it("returns empty for an out-of-range page", () => {
    expect(paginateRows(rows, 3)).toEqual([]);
  });
});
