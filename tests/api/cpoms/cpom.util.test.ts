import { describe, expect, it } from "vitest";

import { CpomDbList } from "@/app/api/cpoms/cpom.db.type";
import {
  filterCpomsByDepartement,
  sortValueForCpomColumn,
} from "@/app/api/cpoms/cpom.util";
import { CpomColumn } from "@/types/ListColumn";

const makeCpom = (overrides: Record<string, unknown>): CpomDbList =>
  ({
    id: 1,
    operateur: { name: "Opérateur" },
    region: { name: "Région" },
    granularity: "DEPARTEMENTALE",
    structures: [],
    departements: [],
    actesAdministratifs: [],
    budgets: [],
    ...overrides,
  }) as unknown as CpomDbList;

const withDepartements = (id: number, numeros: string[]): CpomDbList =>
  makeCpom({
    id,
    departements: numeros.map((numero) => ({ departement: { numero } })),
  });

describe("filterCpomsByDepartement", () => {
  const cpoms = [
    withDepartements(1, ["75"]),
    withDepartements(2, ["92"]),
    withDepartements(3, ["75", "77"]),
  ];

  it("returns everything when no departement filter", () => {
    expect(filterCpomsByDepartement(cpoms, null)).toHaveLength(3);
    expect(filterCpomsByDepartement(cpoms, "")).toHaveLength(3);
  });

  it("keeps cpoms whose departement set contains a filtered numero", () => {
    expect(
      filterCpomsByDepartement(cpoms, "75").map((cpom) => cpom.id)
    ).toEqual([1, 3]);
  });

  it("matches any numero when several are filtered", () => {
    expect(
      filterCpomsByDepartement(cpoms, "92,77").map((cpom) => cpom.id)
    ).toEqual([2, 3]);
  });

  it("uses exact membership, not substring (71 must not match 971)", () => {
    const domCpoms = [withDepartements(1, ["971"]), withDepartements(2, ["71"])];
    expect(
      filterCpomsByDepartement(domCpoms, "71").map((cpom) => cpom.id)
    ).toEqual([2]);
  });

  it("distinguishes Corsican codes 2A and 2B", () => {
    const corsica = [withDepartements(1, ["2A"]), withDepartements(2, ["2B"])];
    expect(
      filterCpomsByDepartement(corsica, "2A").map((cpom) => cpom.id)
    ).toEqual([1]);
  });
});

describe("sortValueForCpomColumn", () => {
  it("reads text columns", () => {
    const cpom = makeCpom({
      operateur: { name: "Acme" },
      region: { name: "Bretagne" },
      granularity: "REGIONALE",
    });
    expect(sortValueForCpomColumn(cpom, "operateur")).toEqual({
      value: "Acme",
      kind: "text",
    });
    expect(sortValueForCpomColumn(cpom, "region")).toEqual({
      value: "Bretagne",
      kind: "text",
    });
    expect(sortValueForCpomColumn(cpom, "granularity")).toEqual({
      value: "REGIONALE",
      kind: "text",
    });
  });

  it("returns null for a missing region", () => {
    const cpom = makeCpom({ region: null });
    expect(sortValueForCpomColumn(cpom, "region")).toEqual({
      value: null,
      kind: "text",
    });
  });

  it("counts structures numerically", () => {
    const cpom = makeCpom({ structures: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    expect(sortValueForCpomColumn(cpom, "structures")).toEqual({
      value: 3,
      kind: "number",
    });
  });

  it("joins departement numeros in sorted order", () => {
    const cpom = withDepartements(1, ["77", "75", "92"]);
    expect(sortValueForCpomColumn(cpom, "departements")).toEqual({
      value: "75, 77, 92",
      kind: "text",
    });
  });

  it("derives date columns from the CONVENTION acte as epoch millis", () => {
    const startDate = new Date("2023-01-01T00:00:00.000Z");
    const endDate = new Date("2026-01-01T00:00:00.000Z");
    const cpom = makeCpom({
      actesAdministratifs: [
        { id: 1, category: "CONVENTION", parentId: null, startDate, endDate },
      ],
    });
    expect(sortValueForCpomColumn(cpom, "dateStart")).toEqual({
      value: startDate.getTime(),
      kind: "number",
    });
    expect(sortValueForCpomColumn(cpom, "dateEnd")).toEqual({
      value: endDate.getTime(),
      kind: "number",
    });
  });

  it("returns null dates when there is no CONVENTION acte", () => {
    const cpom = makeCpom({ actesAdministratifs: [] });
    expect(sortValueForCpomColumn(cpom, "dateStart")).toEqual({
      value: null,
      kind: "number",
    });
  });

  it("falls back to a null text value for an unknown column", () => {
    const cpom = makeCpom({});
    expect(
      sortValueForCpomColumn(cpom, "unknown" as CpomColumn)
    ).toEqual({ value: null, kind: "text" });
  });
});
