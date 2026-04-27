import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FinalisationDocumentsFinanciersPage from "@/app/(authenticated)/structures/[id]/finalisation/02-documents-financiers/page";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationDocumentsFinanciersValidStructure } from "../../../../../test-utils/structure.factory";
import {
  clickButtonByName,
  expectFinalisationStepValidation,
  FinalisationStepValidationPayload,
  findPutStructuresCall,
  getLatestPutStructuresPayloadMatching,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
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

    const body =
      getLatestPutStructuresPayloadMatching<FinalisationStepValidationPayload>(
        mockedFetch,
        (payload) =>
          payload.forms?.[0]?.formSteps?.some(
            (step) => step.stepDefinition.label === "02-documents-financiers"
          ) ?? false
      );
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
    mockStructurePageFetch(structure);

    renderWithStructurePageProviders(
      structure,
      <FinalisationDocumentsFinanciersPage />
    );
    // WHEN
    await clickButtonByName("Je valide la saisie de cette page");

    // THEN
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("should autosave and keep only upload-ready financial documents", async () => {
    // GIVEN
    const structure = createFinalisationDocumentsFinanciersValidStructure(79);
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(
      structure,
      <FinalisationDocumentsFinanciersPage />
    );
    // WHEN
    const checkbox = await screen.findByRole("checkbox", {
      name: /programme 303/i,
    });
    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(findPutStructuresCall(mockedFetch)).toBeDefined();
    });

    // THEN
    const payload = getPutStructuresPayload<{
      id: number;
      creationDate: string;
      date303: string | null;
      structureMillesimes: Array<{ year: number; cpom: boolean }>;
    }>(mockedFetch);

    expect(payload.id).toBe(79);
    expect(payload.date303).toBeNull();
    expect(payload.creationDate).toBeTruthy();
    expect(payload.structureMillesimes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          year: expect.any(Number),
          cpom: expect.any(Boolean),
        }),
      ])
    );
  });
});
