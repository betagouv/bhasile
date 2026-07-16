import { afterEach, describe, expect, it } from "vitest";

import {
  getActualisationYear,
  hasOpenActualisation,
} from "@/app/api/campaigns/campaign.util";

describe("hasOpenActualisation", () => {
  it("renvoie true quand la campagne de l'année existe et n'est pas validée", () => {
    expect(
      hasOpenActualisation(
        [{ slug: "actualisation-2026", isValidated: false, formSteps: [] }],
        2026
      )
    ).toBe(true);
  });

  it("renvoie false quand la campagne de l'année est validée", () => {
    expect(
      hasOpenActualisation(
        [{ slug: "actualisation-2026", isValidated: true, formSteps: [] }],
        2026
      )
    ).toBe(false);
  });

  it("renvoie false quand aucune campagne n'existe pour la structure", () => {
    expect(hasOpenActualisation([], 2026)).toBe(false);
  });

  it("renvoie false pour une autre année", () => {
    expect(
      hasOpenActualisation(
        [{ slug: "actualisation-2026", isValidated: false, formSteps: [] }],
        2027
      )
    ).toBe(false);
  });

  it("ignore les campagnes d'initialisation", () => {
    expect(
      hasOpenActualisation(
        [{ slug: "initialisation", isValidated: false, formSteps: [] }],
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
