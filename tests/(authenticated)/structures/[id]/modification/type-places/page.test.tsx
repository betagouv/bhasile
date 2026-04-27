import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationTypePlacesPage from "@/app/(authenticated)/structures/[id]/modification/type-places/page";
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

vi.mock(
  "@/app/components/forms/ouvertureFermeture/FieldSetOuvertureFermeture",
  () => ({ FieldSetOuvertureFermeture: () => <div>Ouverture fermeture</div> })
);

vi.mock("@/app/components/forms/typePlace/FieldSetTypePlaces", () => ({
  FieldSetTypePlaces: () => <div>Type places</div>,
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
    await waitFor(() => screen.getByRole("button", { name: "Valider" }));

    // WHEN
    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      structureTypologies: Array<{ placesAutorisees: number }>;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.structureTypologies[0]?.placesAutorisees).toBe(10);
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });
});
