import { describe, expect, it, vi } from "vitest";

import {
  assertCampaignOpen,
  getOpenCampaignYears,
  getSelectableCampaignYears,
  isCampaignOpen,
} from "@/app/api/tarifications/tarification.util";

vi.mock("@/app/utils/now.util", async () => {
  const actual = await vi.importActual("@/app/utils/now.util");
  return { ...actual, getCurrentYear: () => 2027 };
});

describe("getOpenCampaignYears", () => {
  it("ouvre la campagne de l'année et celle de l'année suivante", () => {
    expect(getOpenCampaignYears()).toEqual([2027, 2028]);
  });
});

describe("getSelectableCampaignYears", () => {
  it("propose les campagnes ouvertes et les campagnes passées qui ont des échanges, de la plus récente à la plus ancienne", () => {
    expect(getSelectableCampaignYears([2025, 2027])).toEqual([
      2028, 2027, 2025,
    ]);
  });

  it("propose seulement les campagnes ouvertes sans échange passé", () => {
    expect(getSelectableCampaignYears([])).toEqual([2028, 2027]);
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
