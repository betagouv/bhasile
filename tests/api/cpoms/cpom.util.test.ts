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

  it("retourne tout quand aucun filtre département n'est appliqué", () => {
    expect(filterCpomsByDepartement(cpoms, null)).toHaveLength(3);
    expect(filterCpomsByDepartement(cpoms, "")).toHaveLength(3);
  });

  it("garde les cpoms dont l'ensemble de départements contient un numéro filtré", () => {
    expect(
      filterCpomsByDepartement(cpoms, "75").map((cpom) => cpom.id)
    ).toEqual([1, 3]);
  });

  it("correspond à n'importe quel numéro filtré quand plusieurs sont fournis", () => {
    expect(
      filterCpomsByDepartement(cpoms, "92,77").map((cpom) => cpom.id)
    ).toEqual([2, 3]);
  });

  it("utilise une appartenance exacte, pas une sous-chaîne (71 ne doit pas correspondre à 971)", () => {
    const domCpoms = [withDepartements(1, ["971"]), withDepartements(2, ["71"])];
    expect(
      filterCpomsByDepartement(domCpoms, "71").map((cpom) => cpom.id)
    ).toEqual([2]);
  });

  it("distingue les codes corses 2A et 2B", () => {
    const corsica = [withDepartements(1, ["2A"]), withDepartements(2, ["2B"])];
    expect(
      filterCpomsByDepartement(corsica, "2A").map((cpom) => cpom.id)
    ).toEqual([1]);
  });
});

describe("sortValueForCpomColumn", () => {
  it("lit les colonnes de texte", () => {
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

  it("retourne null pour une région absente", () => {
    const cpom = makeCpom({ region: null });
    expect(sortValueForCpomColumn(cpom, "region")).toEqual({
      value: null,
      kind: "text",
    });
  });

  it("compte les structures numériquement", () => {
    const cpom = makeCpom({ structures: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    expect(sortValueForCpomColumn(cpom, "structures")).toEqual({
      value: 3,
      kind: "number",
    });
  });

  it("joint les numéros de département dans l'ordre trié", () => {
    const cpom = withDepartements(1, ["77", "75", "92"]);
    expect(sortValueForCpomColumn(cpom, "departements")).toEqual({
      value: "75, 77, 92",
      kind: "text",
    });
  });

  it("dérive les colonnes de date de l'acte CONVENTION_CPOM en millisecondes epoch", () => {
    const startDate = new Date("2023-01-01T00:00:00.000Z");
    const endDate = new Date("2026-01-01T00:00:00.000Z");
    const cpom = makeCpom({
      actesAdministratifs: [
        {
          id: 1,
          category: "CONVENTION_CPOM",
          parentId: null,
          startDate,
          endDate,
        },
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

  it("retourne des dates nulles quand il n'y a pas d'acte CONVENTION", () => {
    const cpom = makeCpom({ actesAdministratifs: [] });
    expect(sortValueForCpomColumn(cpom, "dateStart")).toEqual({
      value: null,
      kind: "number",
    });
  });

  it("retombe sur une valeur texte nulle pour une colonne inconnue", () => {
    const cpom = makeCpom({});
    expect(
      sortValueForCpomColumn(cpom, "unknown" as CpomColumn)
    ).toEqual({ value: null, kind: "text" });
  });
});
