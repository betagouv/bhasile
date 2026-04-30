import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FinalisationDocumentsPage from "@/app/(authenticated)/(with-menu)/structures/[id]/finalisation/05-documents/page";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationValidStructure } from "../../../../../test-utils/structure.factory";
import {
  clickButtonByName,
  expectFinalisationStepValidation,
  FinalisationStepValidationPayload,
  findPutStructuresCall,
  flushAutoSaveDebounce,
  getLatestPutStructuresPayloadMatching,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

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

    const body =
      getLatestPutStructuresPayloadMatching<FinalisationStepValidationPayload>(
        mockedFetch,
        (payload) =>
          payload.forms?.[0]?.formSteps?.some(
            (step) => step.stepDefinition.label === "05-documents"
          ) ?? false
      );
    expectFinalisationStepValidation(body, {
      structureId: 77,
      stepLabel: "05-documents",
      nextRoute: "06-notes",
      mockRouterPush,
    });
  });

  it("should autosave documents data after debounce", async () => {
    // GIVEN
    const base = createFinalisationValidStructure(79);
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
      ],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    vi.useFakeTimers();
    renderWithStructurePageProviders(structure, <FinalisationDocumentsPage />);

    // WHEN
    const input = screen.getAllByRole("textbox")[0];
    fireEvent.change(input, { target: { value: "2023-01-01" } });
    await flushAutoSaveDebounce();

    // THEN
    expect(findPutStructuresCall(mockedFetch)).toBeDefined();
    const payload = getPutStructuresPayload<{
      id: number;
      actesAdministratifs?: Array<{ id: number; category: string }>;
    }>(mockedFetch);
    expect(payload.id).toBe(79);
    expect(payload.actesAdministratifs?.length).toBeGreaterThan(0);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
