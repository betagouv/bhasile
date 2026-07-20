import { describe, expect, it } from "vitest";

import {
  PlacesResolvableVersion,
  resolvePlacesAutoriseesForYear,
} from "@/app/api/structure-typologies/structure-typologie.util";

const makeVersion = (
  overrides: Partial<PlacesResolvableVersion>
): PlacesResolvableVersion => ({
  id: 1,
  effectiveDate: null,
  structureVersionTransformationId: null,
  structureVersionTransformation: null,
  placesAutorisees: null,
  ...overrides,
});

const finalizedTransfo = (
  overrides: Partial<PlacesResolvableVersion>
): PlacesResolvableVersion =>
  makeVersion({
    structureVersionTransformationId: 99,
    structureVersionTransformation: {
      transformation: { form: { status: true } },
    },
    ...overrides,
  });

describe("resolvePlacesAutoriseesForYear", () => {
  const now = new Date("2028-07-01T12:00:00Z");

  it("renvoie la valeur legacy figée pour une année < seuil", () => {
    expect(resolvePlacesAutoriseesForYear(2024, 80, [], now)).toBe(80);
  });

  it("renvoie undefined pour une année legacy sans donnée", () => {
    expect(resolvePlacesAutoriseesForYear(2024, null, [], now)).toBeUndefined();
  });

  it("résout l'autorisée d'une année versionnée depuis la version en vigueur", () => {
    const base = makeVersion({
      effectiveDate: new Date("2020-01-01"),
      placesAutorisees: 100,
    });
    expect(resolvePlacesAutoriseesForYear(2026, null, [base], now)).toBe(100);
  });

  it("date la nouvelle valeur dans l'année de la transfo mi-année (référence 31 déc)", () => {
    const base = makeVersion({
      id: 10,
      effectiveDate: new Date("2020-01-01"),
      placesAutorisees: 100,
    });
    const extension = finalizedTransfo({
      id: 20,
      effectiveDate: new Date("2028-06-15"),
      placesAutorisees: 120,
    });
    const versions = [base, extension];
    // Note : now est postérieur pour ne pas capper l'année de la transfo.
    const afterNow = new Date("2029-07-01T12:00:00Z");
    expect(
      resolvePlacesAutoriseesForYear(2027, null, versions, afterNow)
    ).toBe(100);
    expect(
      resolvePlacesAutoriseesForYear(2028, null, versions, afterNow)
    ).toBe(120);
  });

  it("renvoie undefined après une fermeture (SV terminale sans places)", () => {
    const base = makeVersion({
      id: 10,
      effectiveDate: new Date("2020-01-01"),
      placesAutorisees: 120,
    });
    const fermeture = finalizedTransfo({
      id: 30,
      effectiveDate: new Date("2027-06-15"),
      placesAutorisees: null,
    });
    const versions = [base, fermeture];
    expect(
      resolvePlacesAutoriseesForYear(2026, null, versions, now)
    ).toBe(120);
    expect(
      resolvePlacesAutoriseesForYear(2027, null, versions, now)
    ).toBeUndefined();
  });

  it("cappe à now : n'anticipe pas une transfo committée à effet futur", () => {
    const midYearNow = new Date("2026-07-17T12:00:00Z");
    const base = makeVersion({
      id: 10,
      effectiveDate: new Date("2020-01-01"),
      placesAutorisees: 100,
    });
    const futureEffective = finalizedTransfo({
      id: 40,
      effectiveDate: new Date("2026-09-01"),
      placesAutorisees: 150,
    });
    expect(
      resolvePlacesAutoriseesForYear(2026, null, [base, futureEffective], midYearNow)
    ).toBe(100);
  });

  it("ignore une transfo en brouillon (non finalisée)", () => {
    const base = makeVersion({
      id: 10,
      effectiveDate: new Date("2020-01-01"),
      placesAutorisees: 100,
    });
    const draft = makeVersion({
      id: 50,
      effectiveDate: new Date("2028-06-15"),
      placesAutorisees: 120,
      structureVersionTransformationId: 99,
      structureVersionTransformation: {
        transformation: { form: { status: false } },
      },
    });
    expect(
      resolvePlacesAutoriseesForYear(2028, null, [base, draft], now)
    ).toBe(100);
  });
});
