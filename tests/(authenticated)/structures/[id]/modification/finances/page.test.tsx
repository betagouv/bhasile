import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationFinancesPage from "@/app/(authenticated)/structures/[id]/modification/finances/page";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createModificationFinancesValidStructure } from "../../../../../test-utils/structure.factory";
import {
  clickButtonByName,
  findPutStructuresCall,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

describe("ModificationFinances page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and navigate back to the structure page", async () => {
    // GIVEN
    const structure = createModificationFinancesValidStructure(77);
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <ModificationFinancesPage />);
    // WHEN
    await clickButtonByName("Valider");

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      budgets: Array<{ id: number; year: number }>;
      indicateursFinanciers: Array<{ id: number; year: number; type: string }>;
      documentsFinanciers: unknown[];
      structureMillesimes: Array<{ year: number; cpom: boolean }>;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.budgets).toEqual(structure.budgets);
    expect(body.indicateursFinanciers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ year: 2026, type: "PREVISIONNEL" }),
        expect.objectContaining({ year: 2026, type: "REALISE" }),
        expect.objectContaining({ year: 2025, type: "PREVISIONNEL" }),
        expect.objectContaining({ year: 2025, type: "REALISE" }),
      ])
    );
    expect(body.indicateursFinanciers.every((item) => item.year >= 2021)).toBe(
      true
    );
    expect(body.documentsFinanciers).toEqual([]);
    expect(body.structureMillesimes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          year: expect.any(Number),
          cpom: expect.any(Boolean),
        }),
      ])
    );
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });

  it("should block submit when indicators are missing", async () => {
    // GIVEN
    const structure = {
      ...createModificationFinancesValidStructure(78),
      indicateursFinanciers: [],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <ModificationFinancesPage />);
    // WHEN
    await clickButtonByName("Valider");

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeUndefined();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
