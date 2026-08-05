import { describe, expect, it } from "vitest";

import {
  compareSortValues,
  getSafePage,
  paginateRows,
  paginateWithTotal,
  sortRows,
} from "@/app/utils/list.util";
import { DEFAULT_PAGE_SIZE, MIDDLE_PAGE_SIZE } from "@/constants";

describe("compareSortValues", () => {
  it("trie le texte avec la collation française", () => {
    expect(compareSortValues("a", "b", "asc", "text")).toBeLessThan(0);
    expect(compareSortValues("b", "a", "asc", "text")).toBeGreaterThan(0);
    expect(compareSortValues("a", "a", "asc", "text")).toBe(0);
  });

  it("trie les nombres numériquement, pas lexicalement", () => {
    expect(compareSortValues(2, 10, "asc", "number")).toBeLessThan(0);
    expect(compareSortValues(10, 2, "asc", "number")).toBeGreaterThan(0);
  });

  it("inverse la comparaison en desc", () => {
    expect(compareSortValues("a", "b", "desc", "text")).toBeGreaterThan(0);
    expect(compareSortValues(2, 10, "desc", "number")).toBeGreaterThan(0);
  });

  it("place les null en dernier en asc, en premier en desc", () => {
    expect(compareSortValues(null, 1, "asc", "number")).toBeGreaterThan(0);
    expect(compareSortValues(1, null, "asc", "number")).toBeLessThan(0);
    expect(compareSortValues(null, 1, "desc", "number")).toBeLessThan(0);
    expect(compareSortValues(1, null, "desc", "number")).toBeGreaterThan(0);
  });

  it("traite deux null comme égaux dans les deux sens", () => {
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
  it("trie selon l'accesseur primaire", () => {
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

  it("départage les égalités numériquement via l'accesseur de tie-break", () => {
    const rows: Row[] = [
      { name: "a", id: 10 },
      { name: "a", id: 2 },
    ];
    expect(sortByNameTieId(rows, "asc").map((row) => row.id)).toEqual([2, 10]);
  });

  it("garde le tie-break ascendant même quand le tri primaire est desc", () => {
    const rows: Row[] = [
      { name: "a", id: 10 },
      { name: "a", id: 2 },
    ];
    expect(sortByNameTieId(rows, "desc").map((row) => row.id)).toEqual([2, 10]);
  });

  it("trie les valeurs primaires null en dernier en asc", () => {
    const rows: Row[] = [
      { name: null, id: 1 },
      { name: "a", id: 2 },
    ];
    expect(sortByNameTieId(rows, "asc").map((row) => row.name)).toEqual([
      "a",
      null,
    ]);
  });

  it("ne mute pas le tableau d'entrée", () => {
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

  it("renvoie la première page", () => {
    const page = paginateRows(rows, 0);
    expect(page).toHaveLength(DEFAULT_PAGE_SIZE);
    expect(page[0]).toBe(0);
  });

  it("renvoie la page suivante décalée de la taille de page", () => {
    const page = paginateRows(rows, 1);
    expect(page[0]).toBe(DEFAULT_PAGE_SIZE);
    expect(page).toHaveLength(DEFAULT_PAGE_SIZE);
  });

  it("renvoie la dernière page partielle", () => {
    expect(paginateRows(rows, 2)).toHaveLength(5);
  });

  it("renvoie un tableau vide pour une page hors limites", () => {
    expect(paginateRows(rows, 3)).toEqual([]);
  });

  it("ramène une page négative à la première page", () => {
    expect(paginateRows(rows, -1)).toEqual(paginateRows(rows, 0));
    expect(paginateRows(rows, -5)).toEqual(paginateRows(rows, 0));
  });

  it("respecte une taille de page personnalisée", () => {
    const firstPage = paginateRows(rows, 0, 5);
    expect(firstPage).toHaveLength(5);
    expect(firstPage[0]).toBe(0);

    const secondPage = paginateRows(rows, 1, 5);
    expect(secondPage[0]).toBe(5);
    expect(secondPage).toHaveLength(5);
  });
});

describe("getSafePage", () => {
  it("conserve une page dans les bornes", () => {
    expect(getSafePage(1, 30, 12)).toBe(1);
  });

  it("ramène une page négative à zéro", () => {
    expect(getSafePage(-5, 30, 12)).toBe(0);
  });

  it("clampe une page au-delà de la dernière", () => {
    expect(getSafePage(99, 30, 12)).toBe(2);
  });

  it("renvoie zéro quand il n'y a aucune ligne", () => {
    expect(getSafePage(3, 0, 12)).toBe(0);
  });

  it("renvoie zéro quand tout tient sur une page", () => {
    expect(getSafePage(2, 12, 12)).toBe(0);
  });

  it("dépend de la taille de page fournie", () => {
    expect(getSafePage(2, 30, 20)).toBe(1);
  });

  it("ramène une page non numérique à la première page", () => {
    expect(getSafePage(Number("abc"), 30, 12)).toBe(0);
    expect(getSafePage(Infinity, 30, 12)).toBe(0);
  });
});

describe("paginateWithTotal", () => {
  const rows = Array.from({ length: 13 }, (_, index) => index + 1);

  it("renvoie le total complet et la première page", () => {
    const result = paginateWithTotal(rows, 0, MIDDLE_PAGE_SIZE);

    expect(result.total).toBe(13);
    expect(result.rows).toHaveLength(12);
  });

  it("renvoie la page suivante", () => {
    const result = paginateWithTotal(rows, 1, MIDDLE_PAGE_SIZE);

    expect(result.total).toBe(13);
    expect(result.rows).toEqual([13]);
  });

  it("clampe une page hors borne à la dernière page (jamais vide)", () => {
    const result = paginateWithTotal(rows, 99, MIDDLE_PAGE_SIZE);

    expect(result.rows).toEqual([13]);
  });

  it("renvoie un total nul et aucune ligne pour une liste vide", () => {
    expect(paginateWithTotal([], 0, MIDDLE_PAGE_SIZE)).toEqual({
      total: 0,
      rows: [],
    });
  });
});
