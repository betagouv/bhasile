import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationDescriptionPage from "@/app/(authenticated)/structures/[id]/modification/description/page";
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
    await clickButtonByName("Valider");

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      codeBhasile: string;
      nom: string;
      public: string;
      lgbt: boolean;
      fvvTeh: boolean;
      adresseAdministrative: string;
      codePostalAdministratif: string;
      communeAdministrative: string;
      departementAdministratif: string;
      contacts: unknown[];
      dnaStructures: Array<{
        id: number;
        dna: { code: string; description: string };
        startDate: string | null;
        endDate: string | null;
      }>;
      finesses: unknown[];
      type: string;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.codeBhasile).toBe("BHA-77");
    expect(body.nom).toBe(structure.nom);
    expect(body.public).toBe("Tout public");
    expect(body.lgbt).toBe(structure.lgbt);
    expect(body.fvvTeh).toBe(structure.fvvTeh);
    expect(body.adresseAdministrative).toBe(structure.adresseAdministrative);
    expect(body.codePostalAdministratif).toBe(
      structure.codePostalAdministratif
    );
    expect(body.communeAdministrative).toBe(structure.communeAdministrative);
    expect(body.departementAdministratif).toBe(
      structure.departementAdministratif
    );
    expect(body.contacts).toEqual(structure.contacts);
    expect(body.dnaStructures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          dna: expect.objectContaining({
            code: "C0001",
          }),
          startDate: null,
          endDate: null,
        }),
      ])
    );
    expect(body.finesses).toEqual(structure.finesses);
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });
});
