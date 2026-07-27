import { beforeEach, describe, expect, it, vi } from "vitest";

import ActualisationDocumentsFinanciers from "@/app/(authenticated)/(with-menu)/structures/[id]/actualisation/[year]/02-documents-financiers/page";

import { createFinalisationDocumentsFinanciersValidStructure } from "../../../../../../test-utils/structure.factory";
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

const docsStructure = () => ({
  ...createFinalisationDocumentsFinanciersValidStructure(1),
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

describe("Page actualisation 02-documents-financiers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("valide l'étape documents vers /api/campaigns", async () => {
    const fetchMock = global.fetch as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => docsStructure(),
    });

    renderWithStructurePageProviders(
      docsStructure(),
      <ActualisationDocumentsFinanciers />
    );

    await clickButtonByName("Valider");

    const campaignPut = findCampaignPut(fetchMock);
    expect(campaignPut).toBeDefined();
    const payload = JSON.parse((campaignPut?.[1] as RequestInit).body as string);
    expect(payload).toMatchObject({
      structureId: 1,
      year: 2026,
      step: { slug: "02-documents-financiers", status: "VALIDE" },
    });
  });
});
