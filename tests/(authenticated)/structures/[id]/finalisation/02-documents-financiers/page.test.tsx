import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FinalisationDocumentsFinanciersPage from "@/app/(authenticated)/structures/[id]/finalisation/02-documents-financiers/page";
import { StepStatus } from "@/types/form.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationDocumentsFinanciersValidStructure } from "../../../../../test-utils/structure.factory";
import {
  findPutStructuresCall,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

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
    await waitFor(() =>
      screen.getByRole("button", { name: "Je valide la saisie de cette page" })
    );

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Je valide la saisie de cette page" })
    );

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
    expect(body.id).toBe(77);
    expect(body.forms[0].formSteps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stepDefinition: expect.objectContaining({
            label: "02-documents-financiers",
          }),
          status: StepStatus.VALIDE,
        }),
      ])
    );
    expect(mockRouterPush).toHaveBeenCalledWith("03-finance");
  });

  it("should block submit when required financial documents are missing", async () => {
    // GIVEN
    const structure = {
      ...createFinalisationDocumentsFinanciersValidStructure(78),
      documentsFinanciers: [],
    };
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(
      structure,
      <FinalisationDocumentsFinanciersPage />
    );
    await waitFor(() =>
      screen.getByRole("button", { name: "Je valide la saisie de cette page" })
    );

    // WHEN
    await userEvent.click(
      screen.getByRole("button", { name: "Je valide la saisie de cette page" })
    );

    // THEN
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
