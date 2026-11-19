import { describe, expect, it } from "vitest";

import {
  getCampaignPhase,
  getCatchUpCampaignYears,
  getOpenCampaignYears,
} from "@/lib/tarification/tarification.campaign";

const PARIS = "Europe/Paris";

describe("getCampaignPhase", () => {
  it("ouvre la campagne N le 1er janvier N-1, heure de Paris", () => {
    expect(
      getCampaignPhase(2028, new Date("2026-12-31T22:59:59Z"), PARIS)
    ).toBe("UPCOMING");
    expect(
      getCampaignPhase(2028, new Date("2026-12-31T23:00:00Z"), PARIS)
    ).toBe("OPEN");
  });

  it("passe la campagne N en rattrapage le 1er janvier N+1, heure de Paris", () => {
    expect(
      getCampaignPhase(2028, new Date("2028-12-31T22:59:59Z"), PARIS)
    ).toBe("OPEN");
    expect(
      getCampaignPhase(2028, new Date("2028-12-31T23:00:00Z"), PARIS)
    ).toBe("CATCH_UP");
  });

  it("ouvre la campagne à minuit heure locale outre-mer", () => {
    expect(
      getCampaignPhase(2028, new Date("2026-12-31T20:00:00Z"), "Indian/Reunion")
    ).toBe("OPEN");
  });

  it("garde la campagne en rattrapage sans limite de durée", () => {
    expect(
      getCampaignPhase(2028, new Date("2035-06-01T12:00:00Z"), PARIS)
    ).toBe("CATCH_UP");
  });
});

describe("getOpenCampaignYears", () => {
  it("ouvre la campagne de l'année locale et celle de l'année suivante", () => {
    const now = new Date("2026-12-31T21:00:00Z");

    expect(getOpenCampaignYears(now, PARIS)).toEqual([2026, 2027]);
    expect(getOpenCampaignYears(now, "Indian/Reunion")).toEqual([2027, 2028]);
  });
});

describe("getCatchUpCampaignYears", () => {
  it("propose les campagnes closes depuis la mise en service", () => {
    expect(
      getCatchUpCampaignYears(new Date("2030-06-01T12:00:00Z"), PARIS)
    ).toEqual([2027, 2028, 2029]);
  });

  it("ne propose rien avant la fin de la première campagne", () => {
    expect(
      getCatchUpCampaignYears(new Date("2027-06-01T12:00:00Z"), PARIS)
    ).toEqual([]);
    expect(
      getCatchUpCampaignYears(new Date("2026-06-01T12:00:00Z"), PARIS)
    ).toEqual([]);
  });
});
