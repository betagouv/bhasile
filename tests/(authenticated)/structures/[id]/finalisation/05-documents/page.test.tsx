import { beforeEach, describe, expect, it, vi } from "vitest";

import FinalisationDocumentsPage from "@/app/(authenticated)/structures/[id]/finalisation/05-documents/page";
import { StepStatus } from "@/types/form.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationValidStructure } from "../../../../../test-utils/structure.factory";
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

vi.mock(
  "@/app/components/forms/actesAdministratifs/ActesAdministratifs",
  () => ({ ActesAdministratifs: () => <div>Actes administratifs</div> })
);

describe("FinalisationDocuments page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and send updated finalisation step in PUT payload", async () => {
    // GIVEN
    // Provide valid actesAdministratifs so the autorisee schema passes validation
    const base = createFinalisationValidStructure(77);
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

    renderWithStructurePageProviders(structure, <FinalisationDocumentsPage />);
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
      stepLabel: "05-documents",
      nextRoute: "06-notes",
      mockRouterPush,
    });
  });
});
