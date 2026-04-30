import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationTypePlacesPage from "@/app/(authenticated)/(with-menu)/structures/[id]/modification/type-places/page";
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

describe("ModificationTypePlaces page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and navigate back to the structure page", async () => {
    // GIVEN
    const structure = createStructure({ id: 77, type: StructureType.CADA });
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <ModificationTypePlacesPage />);
    // WHEN
    await clickButtonByName("Valider");

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      structureTypologies: Array<{
        id: number;
        year: number;
        placesAutorisees: number;
        lgbt: number;
        pmr: number;
        fvvTeh: number;
      }>;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.structureTypologies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          year: expect.any(Number),
          placesAutorisees: 10,
          lgbt: 0,
          pmr: 0,
          fvvTeh: 0,
        }),
      ])
    );
    expect(body.structureTypologies[0]?.placesAutorisees).toBe(10);
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });
});
