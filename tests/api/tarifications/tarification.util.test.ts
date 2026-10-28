import { describe, expect, it, vi } from "vitest";

import {
  assertCampaignOpen,
  getOpenCampaignYears,
  isCampaignOpen,
} from "@/app/api/tarifications/tarification.util";

vi.mock("@/constants", async () => {
  const actual = await vi.importActual("@/constants");
  return {
    ...actual,
    CURRENT_YEAR: 2027,
  };
});

describe("getOpenCampaignYears", () => {
  it("ouvre la campagne de l'année et celle de l'année suivante", () => {
    expect(getOpenCampaignYears()).toEqual([2027, 2028]);
  });
});

describe("isCampaignOpen", () => {
  it("considère ouvertes les campagnes de l'année et de l'année suivante", () => {
    expect(isCampaignOpen(2027)).toBe(true);
    expect(isCampaignOpen(2028)).toBe(true);
  });

  it("considère fermées les campagnes passées et trop lointaines", () => {
    expect(isCampaignOpen(2026)).toBe(false);
    expect(isCampaignOpen(2029)).toBe(false);
  });
});

describe("assertCampaignOpen", () => {
  it("rejette l'écriture dans une campagne passée", () => {
    expect(() => assertCampaignOpen(2026)).toThrow("lecture seule");
  });
});
