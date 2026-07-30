import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationAdressesPage from "@/app/(authenticated)/(with-menu)/structures/[id]/modification/adresses/page";

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
  usePathname: () => "/",
}));

describe("ModificationAdresses page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("soumet les adresses et redirige vers la page de la structure", async () => {
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
      typeBati: string;
      adresses: Array<{
        id: number;
        adresse: string;
        commune: string;
        codePostal: string;
        repartition: string;
        placesAutorisees?: number;
        isQpv?: boolean;
        isLogementSocial?: boolean;
      }>;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.typeBati).toBe("COLLECTIF");
    expect(body.adresses).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          adresse: "1 rue de Paris",
          commune: "Paris",
          codePostal: "75011",
          repartition: "COLLECTIF",
          placesAutorisees: 10,
          isQpv: false,
          isLogementSocial: false,
        }),
      ])
    );
    expect(body.adresses[0]?.placesAutorisees).toBe(10);
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });

  it("bloque la soumission quand toutes les adresses ont zéro place", async () => {
    // GIVEN
    const structure = {
      ...createModificationAdressesValidStructure(78),
      adresses: [
        {
          ...createModificationAdressesValidStructure(78).adresses[0],
          placesAutorisees: 0,
          isQpv: false,
          isLogementSocial: false,
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
