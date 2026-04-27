import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import FinalisationControlesPage from "@/app/(authenticated)/structures/[id]/finalisation/04-controles/page";
import { StepStatus } from "@/types/form.type";

import { mockStructurePageFetch } from "../../../../../test-utils/http.mock";
import { createFinalisationControlesValidStructure } from "../../../../../test-utils/structure.factory";
import {
  findPutStructuresCall,
  getPutStructuresPayload,
  renderWithStructurePageProviders,
} from "../../../../../test-utils/structure-page-test.helpers";
import { mockRouterPush } from "../../../../../test-utils/structure-page-test.mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

describe("FinalisationControles page integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    global.fetch = vi.fn();
  });

  it("should submit and send updated finalisation step in PUT payload", async () => {
    // GIVEN
    const structure = createFinalisationControlesValidStructure(77);
    const mockedFetch = mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationControlesPage />);
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
          stepDefinition: expect.objectContaining({ label: "04-controles" }),
          status: StepStatus.VALIDE,
        }),
      ])
    );
    expect(mockRouterPush).toHaveBeenCalledWith("05-documents");
  });

  it("should block submit when evaluation is missing its required date", async () => {
    // GIVEN
    const structure = {
      ...createFinalisationControlesValidStructure(78),
      evaluations: [
        {
          id: 1,
          notePersonne: 1,
          notePro: 1,
          noteStructure: 1,
          note: 1,
          fileUploads: [{ id: 1, key: "evaluation-1" }],
        },
      ],
    };
    mockStructurePageFetch(structure);

    renderWithStructurePageProviders(structure, <FinalisationControlesPage />);
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
