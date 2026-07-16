import { afterEach, describe, expect, it } from "vitest";

import {
  getActualisationYear,
  hasValidatedActualisation,
} from "@/app/api/campaigns/campaign.util";

describe("hasValidatedActualisation", () => {
  it("renvoie true quand la campagne d'actualisation de l'année est validée", () => {
    expect(
      hasValidatedActualisation(
        [{ slug: "actualisation-2026", isValidated: true, formSteps: [] }],
        2026
      )
    ).toBe(true);
  });

  it("renvoie false quand la campagne de l'année n'est pas validée", () => {
    expect(
      hasValidatedActualisation(
        [{ slug: "actualisation-2026", isValidated: false, formSteps: [] }],
        2026
      )
    ).toBe(false);
  });

  it("renvoie false pour une autre année", () => {
    expect(
      hasValidatedActualisation(
        [{ slug: "actualisation-2026", isValidated: true, formSteps: [] }],
        2027
      )
    ).toBe(false);
  });

  it("ignore les campagnes d'initialisation", () => {
    expect(
      hasValidatedActualisation(
        [{ slug: "initialisation", isValidated: true, formSteps: [] }],
        2026
      )
    ).toBe(false);
  });
});

describe("getActualisationYear", () => {
  const originalYear = process.env.ACTUALISATION_YEAR;

  afterEach(() => {
    if (originalYear === undefined) {
      delete process.env.ACTUALISATION_YEAR;
    } else {
      process.env.ACTUALISATION_YEAR = originalYear;
    }
  });

  it("renvoie l'année quand elle est valide", () => {
    process.env.ACTUALISATION_YEAR = "2026";
    expect(getActualisationYear()).toBe(2026);
  });

  it("renvoie null quand la variable n'est pas définie", () => {
    delete process.env.ACTUALISATION_YEAR;
    expect(getActualisationYear()).toBeNull();
  });

  it("renvoie null pour une année non positive", () => {
    process.env.ACTUALISATION_YEAR = "0";
    expect(getActualisationYear()).toBeNull();
  });

  it("renvoie null pour une valeur non entière", () => {
    process.env.ACTUALISATION_YEAR = "abc";
    expect(getActualisationYear()).toBeNull();
  });
});
