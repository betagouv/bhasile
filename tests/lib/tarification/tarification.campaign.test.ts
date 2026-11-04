import { describe, expect, it } from "vitest";

import { getCampaignPhase } from "@/lib/tarification/tarification.campaign";

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
