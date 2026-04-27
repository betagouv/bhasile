import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";
import FinalisationDocumentsPage from "@/app/(authenticated)/structures/[id]/finalisation/05-documents/page";
import { StepStatus } from "@/types/form.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationValidStructure } from "../../../../../test-utils/structure.factory";
import {
  findPutStructuresCall,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";

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
          stepDefinition: expect.objectContaining({ label: "05-documents" }),
          status: StepStatus.VALIDE,
        }),
      ])
    );
    expect(mockRouterPush).toHaveBeenCalledWith("06-notes");
  });
});
