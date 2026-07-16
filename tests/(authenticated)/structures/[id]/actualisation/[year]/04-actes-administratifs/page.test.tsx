import { beforeEach, describe, expect, it, vi } from "vitest";

import ActualisationActesAdministratifs from "@/app/(authenticated)/(with-menu)/structures/[id]/actualisation/[year]/04-actes-administratifs/page";
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

const actesStructure = () => ({
  ...createStructure({ id: 1, type: StructureType.CADA }),
  actesAdministratifs: [
    {
      id: 1,
      category: "ARRETE_TARIFICATION" as const,
      startDate: "2022-01-01T12:00:00.000Z",
      endDate: "2025-01-01T12:00:00.000Z",
      fileUploads: [{ id: 1, key: "arrete-tarification" }],
    },
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

describe("Page actualisation 04-actes-administratifs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("valide l'étape actes vers /api/campaigns pour une autorisée", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => actesStructure(),
    });

    renderWithStructurePageProviders(
      actesStructure(),
      <ActualisationActesAdministratifs />
    );

    await clickButtonByName("Valider");

    const campaignPut = findCampaignPut(fetchMock);
    expect(campaignPut).toBeDefined();
    const payload = JSON.parse((campaignPut?.[1] as RequestInit).body as string);
    expect(payload).toMatchObject({
      structureId: 1,
      year: 2026,
      step: { slug: "04-actes-administratifs", status: "VALIDE" },
    });
  });
});
