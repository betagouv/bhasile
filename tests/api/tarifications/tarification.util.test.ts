import { describe, expect, it } from "vitest";

import {
  assertCampaignOpen,
  getOpenCampaignYears,
  isCampaignOpen,
} from "@/app/api/tarifications/tarification.util";

describe("getOpenCampaignYears", () => {
  it("ouvre la campagne de l'année et celle de l'année suivante", () => {
    expect(getOpenCampaignYears(new Date("2027-05-15T10:00:00.000Z"))).toEqual([
      2027, 2028,
    ]);
  });

  it("change d'année à minuit heure de Paris, pas à minuit UTC", () => {
    const parisNewYear = new Date("2026-12-31T23:30:00.000Z");

    expect(getOpenCampaignYears(parisNewYear)).toEqual([2027, 2028]);
  });
});

describe("isCampaignOpen", () => {
  const now = new Date("2027-05-15T10:00:00.000Z");

  it("considère ouvertes les campagnes de l'année et de l'année suivante", () => {
    expect(isCampaignOpen(2027, now)).toBe(true);
    expect(isCampaignOpen(2028, now)).toBe(true);
  });

  it("considère fermées les campagnes passées et trop lointaines", () => {
    expect(isCampaignOpen(2026, now)).toBe(false);
    expect(isCampaignOpen(2029, now)).toBe(false);
  });
});

describe("assertCampaignOpen", () => {
  it("rejette l'écriture dans une campagne passée", () => {
    expect(() =>
      assertCampaignOpen(2026, new Date("2027-01-01T10:00:00.000Z"))
    ).toThrow("lecture seule");
  });
});
