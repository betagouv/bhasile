import { beforeEach, describe, expect, it, vi } from "vitest";

import ActualisationDocumentsFinanciers from "@/app/(authenticated)/(with-menu)/structures/[id]/actualisation/[year]/02-documents-financiers/page";

import { createActualisationForm } from "../../../../../../test-utils/factories/actualisation-form.factory";
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
  forms: [createActualisationForm(2026)],
});

const findActualisationPut = (fetchMock: ReturnType<typeof vi.fn>) =>
  fetchMock.mock.calls.find(
    (call) =>
      call[0] === "/api/structures/1/actualisation" &&
      (call[1] as RequestInit | undefined)?.method === "PUT"
  );

const stepStatusInPayload = (put: unknown[] | undefined, slug: string) => {
  const payload = JSON.parse((put?.[1] as RequestInit).body as string);
  return payload.forms[0].formSteps.find(
    (formStep: { stepDefinition: { slug: string } }) =>
      formStep.stepDefinition.slug === slug
  )?.status;
};

describe("Page actualisation 02-documents-financiers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("valide l'étape documents via la sous-route actualisation", async () => {
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

    const put = findActualisationPut(fetchMock);
    expect(put).toBeDefined();
    expect(stepStatusInPayload(put, "02-documents-financiers")).toBe("VALIDE");
  });
});
