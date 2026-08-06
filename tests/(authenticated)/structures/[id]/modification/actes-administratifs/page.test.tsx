import { beforeEach, describe, expect, it, vi } from "vitest";

import ModificationActesAdministratifsPage from "@/app/(authenticated)/(with-menu)/structures/[id]/modification/actes-administratifs/page";
import { StructureApiRead } from "@/schemas/api/structure.schema";

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
  usePathname: () => "/",
}));

describe("ModificationActesAdministratifs page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("soumet les actes administratifs et redirige vers la page de la structure", async () => {
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
      actesAdministratifs: Array<{
        id: number;
        category: string;
        startDate: string;
        endDate: string;
        fileUploads: Array<{ id: number; key: string }>;
      }>;
    }>(mockedFetch);
    expect(body.id).toBe(77);
    expect(body.actesAdministratifs).toEqual(structure.actesAdministratifs);
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/77");
  });

  it("valide sans acte propre quand le CPOM porte déjà les arrêtés du type de la structure", async () => {
    // GIVEN
    const base = createStructure({ id: 78 });
    const structure = {
      ...base,
      actesAdministratifs: [],
      cpomStructures: [
        {
          cpom: {
            actesAdministratifs: [
              {
                id: 10,
                category: "ARRETE_AUTORISATION" as const,
                structureType: base.type,
                parentId: null,
                fileUploads: [{ id: 10, key: "arrete-autorisation-cpom" }],
              },
              {
                id: 11,
                category: "ARRETE_TARIFICATION" as const,
                structureType: base.type,
                parentId: null,
                fileUploads: [{ id: 11, key: "arrete-tarification-cpom" }],
              },
            ],
          },
        },
      ] as unknown as StructureApiRead["cpomStructures"],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(
      structure,
      <ModificationActesAdministratifsPage />
    );

    // WHEN
    await clickButtonByName("Valider");

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeDefined();
    expect(mockRouterPush).toHaveBeenCalledWith("/structures/78");
  });
});
