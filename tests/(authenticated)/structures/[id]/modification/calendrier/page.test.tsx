import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationCalendrierPage from "@/app/(authenticated)/(with-menu)/structures/[id]/modification/calendrier/page";
import { StructureType } from "@/types/structure.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createStructure } from "../../../../../test-utils/structure.factory";
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

describe("ModificationCalendrier page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and navigate back to the structure page", async () => {
    // GIVEN
    const structure = createStructure({ id: 77, type: StructureType.CADA });
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <ModificationCalendrierPage />);
    // WHEN
    await clickButtonByName("Valider");

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      codeBhasile: string;
      type: string;
      debutPeriodeAutorisation: string;
      finPeriodeAutorisation: string;
      debutConvention: string;
      finConvention: string;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.codeBhasile).toBe(structure.codeBhasile);
    expect(body.type).toBe(structure.type);
    expect(body.debutPeriodeAutorisation).toContain("2022-01-01");
    expect(body.finPeriodeAutorisation).toContain("2025-01-01");
    expect(body.debutConvention).toContain("2024-01-01");
    expect(body.finConvention).toContain("2027-01-01");
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });
});
