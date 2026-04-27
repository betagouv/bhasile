import { beforeEach, describe, expect, it, vi } from "vitest";

import FinalisationDocumentsFinanciersPage from "@/app/(authenticated)/structures/[id]/finalisation/02-documents-financiers/page";
import { StepStatus } from "@/types/form.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationDocumentsFinanciersValidStructure } from "../../../../../test-utils/structure.factory";
import {
  clickButtonByName,
  expectFinalisationStepValidation,
  findPutStructuresCall,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@/app/components/forms/AutoSave", () => ({
  AutoSave: () => null,
}));

describe("FinalisationDocumentsFinanciers page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and send updated finalisation step in PUT payload", async () => {
    // GIVEN
    const structure = createFinalisationDocumentsFinanciersValidStructure(77);
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(
      structure,
      <FinalisationDocumentsFinanciersPage />
    );
    // WHEN
    await clickButtonByName("Je valide la saisie de cette page");

    // THEN
    const putCall = findPutStructuresCall(mockedFetch);
    expect(putCall).toBeDefined();

    const body = getPutStructuresPayload<{
      id: number;
      forms: Array<{
        formSteps: Array<{
          stepDefinition: { label: string };
          status: StepStatus;
        }>;
      }>;
    }>(mockedFetch);
    expectFinalisationStepValidation(body, {
      structureId: 77,
      stepLabel: "02-documents-financiers",
      nextRoute: "03-finance",
      mockRouterPush,
    });
  });

  it("should block submit when required financial documents are missing", async () => {
    // GIVEN
    const structure = {
      ...createFinalisationDocumentsFinanciersValidStructure(78),
      documentsFinanciers: [],
    };

    renderWithStructurePageProviders(
      structure,
      <FinalisationDocumentsFinanciersPage />
    );
    // WHEN
    await clickButtonByName("Je valide la saisie de cette page");

    // THEN
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
