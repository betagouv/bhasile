import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationControleQualitePage from "@/app/(authenticated)/structures/[id]/modification/controle-qualite/page";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationControlesValidStructure } from "../../../../../test-utils/structure.factory";
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

describe("ModificationControleQualite page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and navigate back to the structure page", async () => {
    // GIVEN
    const structure = createFinalisationControlesValidStructure(77);
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(
      structure,
      <ModificationControleQualitePage />
    );
    // WHEN
    await clickButtonByName("Valider");

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      evaluations: Array<{ date: string }>;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.evaluations.length).toBeGreaterThan(0);
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });
});
