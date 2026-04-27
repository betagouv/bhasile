import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationDescriptionPage from "@/app/(authenticated)/structures/[id]/modification/description/page";
import { StructureType } from "@/types/structure.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createStructure } from "../../../../../test-utils/structure.factory";
import {
  findPutStructuresCall,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@/app/components/common/CustomNotice", () => ({
  CustomNotice: () => <div>Custom notice</div>,
}));

describe("ModificationDescription page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and navigate back to the structure page", async () => {
    // GIVEN
    const structure = createStructure({ id: 77, type: StructureType.CADA });
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(
      structure,
      <ModificationDescriptionPage />
    );
    // DnaAndFiness fetches codes on mount — wait before interacting
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith("/api/dna-codes?structureId=77");
    });

    // WHEN
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{ id: number; codeBhasile: string }>(
      mockedFetch
    );
    expect(body.id).toBe(77);
    expect(body.codeBhasile).toBe("BHA-77");
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });
});
