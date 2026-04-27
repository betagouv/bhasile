import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationAdressesPage from "@/app/(authenticated)/structures/[id]/modification/adresses/page";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createModificationAdressesValidStructure } from "../../../../../test-utils/structure.factory";
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

vi.mock("@/app/components/forms/hebergement/FieldSetHebergement", () => ({
  FieldSetHebergement: () => <div>Hebergement</div>,
}));

vi.mock("@/app/components/forms/hebergement/FieldSetTypeBati", () => ({
  FieldSetTypeBati: () => <div>Type bati</div>,
}));

describe("ModificationAdresses page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and navigate back to the structure page", async () => {
    // GIVEN
    const structure = createModificationAdressesValidStructure(77);
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <ModificationAdressesPage />);
    // WHEN
    await clickButtonByName("Valider");

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      adresses: Array<{
        adresse: string;
        adresseTypologies?: Array<{ placesAutorisees: number }>;
      }>;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.adresses[0]?.adresseTypologies?.[0]?.placesAutorisees).toBe(10);
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });

  it("should block submit when all addresses have zero places", async () => {
    // GIVEN
    const structure = {
      ...createModificationAdressesValidStructure(78),
      adresses: [
        {
          ...createModificationAdressesValidStructure(78).adresses[0],
          adresseTypologies: [
            {
              year: new Date().getFullYear(),
              placesAutorisees: 0,
              qpv: 0,
              logementSocial: 0,
            },
          ],
        },
      ],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <ModificationAdressesPage />);
    // WHEN
    await clickButtonByName("Valider");

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeUndefined();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
