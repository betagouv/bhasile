import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CpomModificationComposition from "@/app/(authenticated)/(with-menu)/cpoms/[id]/modification/composition/page";
import { CpomProvider } from "@/contexts/CpomContext";
import { FetchStateProvider } from "@/contexts/FetchStateContext";
import { CpomApiRead } from "@/schemas/api/cpom.schema";
import { StructureType } from "@/types/structure.type";

import { clickButtonByName } from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: vi.fn() }),
  useParams: () => ({}),
  usePathname: () => "/",
}));

const operateur = { id: 3, name: "Opérateur" };

const buildCpomStructure = (
  structureId: number,
  dateEnd: string | null = null
) => ({
  id: structureId * 10,
  cpomId: 1,
  structureId,
  dateStart: null,
  dateEnd,
  structure: {
    id: structureId,
    codeBhasile: `BHA-${structureId}`,
    type: StructureType.HUDA,
    communeAdministrative: "Nancy",
    departementAdministratif: "54",
    operateur,
    forms: [],
  },
});

const cpom = {
  id: 1,
  operateur,
  granularity: "DEPARTEMENTALE",
  region: { id: 1, name: "Grand Est", code: "44" },
  departements: [{ cpomId: 1, departement: { numero: "54" } }],
  dateStart: "2024-01-01T12:00:00.000Z",
  dateEnd: "2028-12-31T12:00:00.000Z",
  structures: [
    buildCpomStructure(1),
    buildCpomStructure(2, "2026-06-30T12:00:00.000Z"),
  ],
  actesAdministratifs: [],
  budgets: [],
  documentsFinanciers: [],
} as unknown as CpomApiRead;

const mockFetch = () => {
  const mockedFetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.startsWith("/api/structures?")) {
      return new Response(
        JSON.stringify({
          structures: [
            {
              id: 1,
              codeBhasile: "BHA-1",
              type: StructureType.HUDA,
              operateur,
              departementAdministratif: "54",
            },
          ],
          totalStructures: 1,
        })
      );
    }
    if (url === "/api/cpoms/1" && init?.method === "PUT") {
      return new Response(JSON.stringify({ cpomId: 1 }));
    }
    return new Response(JSON.stringify({}));
  });
  global.fetch = mockedFetch as unknown as typeof fetch;
  return mockedFetch;
};

describe("CpomModificationComposition page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("conserve une structure du CPOM absente de la liste sélectionnable, avec sa date de sortie", async () => {
    // GIVEN
    const mockedFetch = mockFetch();
    render(
      <FetchStateProvider>
        <CpomProvider entity={cpom}>
          <CpomModificationComposition />
        </CpomProvider>
      </FetchStateProvider>
    );
    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith(
        expect.stringMatching(/^\/api\/structures\?/)
      );
    });

    // WHEN
    await clickButtonByName("Valider");

    // THEN
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/cpoms/1");
    });
    const putCall = mockedFetch.mock.calls.find(
      ([url, init]) => url === "/api/cpoms/1" && init?.method === "PUT"
    );
    const body = JSON.parse(putCall?.[1]?.body as string) as {
      structures: { structureId: number; dateEnd?: string }[];
    };
    expect(body.structures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ structureId: 1 }),
        expect.objectContaining({
          structureId: 2,
          dateEnd: "2026-06-30T12:00:00.000Z",
        }),
      ])
    );
  });
});
