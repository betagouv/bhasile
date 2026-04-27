import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationActesAdministratifsPage from "@/app/(authenticated)/structures/[id]/modification/actes-administratifs/page";

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

describe("ModificationActesAdministratifs page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and navigate back to the structure page", async () => {
    // GIVEN
    // Provide valid actesAdministratifs so the autorisee schema passes validation
    const base = createStructure({ id: 77 });
    const structure = {
      ...base,
      actesAdministratifs: [
        {
          id: 1,
          category: "ARRETE_AUTORISATION" as const,
          startDate: "2022-01-01T12:00:00.000Z",
          endDate: "2025-01-01T12:00:00.000Z",
          fileUploads: [{ id: 1, key: "arrete-autorisation" }],
        },
        {
          id: 2,
          category: "ARRETE_TARIFICATION" as const,
          startDate: "2022-01-01T12:00:00.000Z",
          endDate: "2025-01-01T12:00:00.000Z",
          fileUploads: [{ id: 2, key: "arrete-tarification" }],
        },
      ],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(
      structure,
      <ModificationActesAdministratifsPage />
    );
    // WHEN
    await clickButtonByName("Valider");

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      actesAdministratifs: Array<{ category: string }>;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.actesAdministratifs.length).toBeGreaterThan(0);
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });
});
