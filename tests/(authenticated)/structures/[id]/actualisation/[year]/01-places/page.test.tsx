import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ActualisationPlaces from "@/app/(authenticated)/(with-menu)/structures/[id]/actualisation/[year]/01-places/page";
import { StructureType } from "@/types/structure.type";

import { createStructure } from "../../../../../../test-utils/structure.factory";
import {
  clickButtonByName,
  renderWithStructurePageProviders,
} from "../../../../../../test-utils/structure-page-test.helpers";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/",
  useParams: () => ({ year: "2026" }),
}));
vi.mock("@/app/components/forms/AutoSave", () => ({ AutoSave: () => null }));

const actualisationStructure = () => ({
  ...createStructure({ id: 1, type: StructureType.CADA }),
  structureTypologies: [
    { year: 2026, placesAutorisees: 100, pmr: 5, lgbt: 2, fvvTeh: 3 },
  ],
  campaigns: [
    { slug: "actualisation-2026", isValidated: false, formSteps: [] },
  ],
});

const findCampaignPut = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.find(
    (call) =>
      call[0] === "/api/campaigns" &&
      (call[1] as RequestInit | undefined)?.method === "PUT"
  );

describe("Page actualisation 01-places", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("affiche le formulaire places de l'année d'actualisation", () => {
    renderWithStructurePageProviders(
      actualisationStructure(),
      <ActualisationPlaces />
    );

    expect(
      screen.getByText("Types de place (tels que prévus dans la convention 2026)")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Valider" })
    ).toBeInTheDocument();
  });

  it("valide l'étape vers /api/campaigns puis navigue à l'étape suivante", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => actualisationStructure(),
    });

    renderWithStructurePageProviders(
      actualisationStructure(),
      <ActualisationPlaces />
    );

    await clickButtonByName("Valider");

    const campaignPut = findCampaignPut(fetchMock);
    expect(campaignPut).toBeDefined();
    const payload = JSON.parse((campaignPut?.[1] as RequestInit).body as string);
    expect(payload).toMatchObject({
      structureId: 1,
      year: 2026,
      step: { slug: "01-places", status: "VALIDE" },
    });
    expect(mockRouterPush).toHaveBeenCalledWith(
      "/structures/1/actualisation/2026/02-documents-financiers"
    );
  });
});
